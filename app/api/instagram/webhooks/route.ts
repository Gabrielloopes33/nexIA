import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/instagram/config";
import { createHmac } from "crypto";
import { updateLeadScore } from "@/lib/pipeline/scoring";

/**
 * GET /api/instagram/webhooks
 * Verificação do webhook (challenge-response)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === config.webhookVerifyToken) {
    console.log("[Instagram Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("[Instagram Webhook] Verification failed", { mode, token });
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/instagram/webhooks
 * Processa eventos de webhook do Instagram
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const body = await request.text();

    // Validate signature
    if (config.appSecret && signature) {
      const expectedSignature = createHmac("sha256", config.appSecret)
        .update(body)
        .digest("hex");
      
      if (!signature.endsWith(expectedSignature)) {
        console.error("[Instagram Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);

    // Log webhook
    await logWebhookEvent(payload);

    // Process events
    if (payload.object === "instagram") {
      for (const entry of payload.entry || []) {
        const instagramId = entry.id;
        
        for (const messaging of entry.messaging || []) {
          if (messaging.message) {
            await handleMessageReceived(instagramId, messaging);
          } else if (messaging.postback) {
            await handlePostback(instagramId, messaging);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Instagram Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

/**
 * Log webhook event
 */
async function logWebhookEvent(payload: unknown) {
  try {
    // Note: In production, you'd want to save this to a dedicated logs table
    console.log("[Instagram Webhook] Event received:", JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("[Instagram Webhook] Error logging event:", error);
  }
}

/**
 * Helper: Create deal activity for incoming message if contact has active deal
 */
async function createDealActivityForMessage(
  contactId: string,
  messageText: string,
  messageId: string
) {
  try {
    // Find active deals for this contact
    const activeDeals = await prisma.deal.findMany({
      where: {
        contactId,
        status: 'OPEN',
      },
      select: {
        id: true,
        leadScore: true,
      },
    });

    if (activeDeals.length === 0) {
      return; // No active deals, nothing to do
    }

    // Create activity and update score for each active deal
    for (const deal of activeDeals) {
      // Create deal activity
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          type: 'INSTAGRAM',
          title: 'Mensagem recebida via Instagram',
          content: messageText.slice(0, 200), // Limit to 200 chars
          metadata: {
            messageId,
            channel: 'INSTAGRAM',
            preview: messageText.slice(0, 100),
          },
          scoreImpact: 2,
        },
      });

      // Update lead score
      const newScore = updateLeadScore(deal.leadScore, 'INSTAGRAM');
      await prisma.deal.update({
        where: { id: deal.id },
        data: { leadScore: newScore },
      });

      console.log(`[Instagram Webhook] Created INSTAGRAM activity for deal ${deal.id}, new score: ${newScore}`);
    }
  } catch (error) {
    console.error('[Instagram Webhook] Error creating deal activity:', error);
    // Don't throw - this is a secondary operation
  }
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
    reply_to?: { mid: string };
  };
  postback?: {
    mid: string;
    payload: string;
    title: string;
  };
}

/**
 * Handle incoming message
 */
async function handleMessageReceived(instagramId: string, messaging: MessagingEvent) {
  const senderId = messaging.sender.id;
  const recipientId = messaging.recipient.id;
  const message = messaging.message;

  if (!message) return;

  try {
    // Find the Instagram instance
    const instance = await prisma.instagramInstance.findFirst({
      where: { instagramId },
    });

    if (!instance) {
      console.error(`[Instagram Webhook] Instance not found for ${instagramId}`);
      return;
    }

    // Upsert contact
    const contact = await prisma.contact.upsert({
      where: {
        organizationId_externalId_channel: {
          organizationId: instance.organizationId,
          externalId: senderId,
          channel: "INSTAGRAM",
        },
      },
      update: { lastActivityAt: new Date() },
      create: {
        organizationId: instance.organizationId,
        externalId: senderId,
        channel: "INSTAGRAM",
        name: senderId,
        lastActivityAt: new Date(),
      },
    });

    // Find or create conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        contactId_channel: {
          contactId: contact.id,
          channel: "INSTAGRAM",
        },
      },
      update: {
        lastMessageAt: new Date(),
        status: "OPEN",
      },
      create: {
        contactId: contact.id,
        channel: "INSTAGRAM",
        instagramInstanceId: instance.id,
        status: "OPEN",
        lastMessageAt: new Date(),
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Determine message type and content
    let type = "TEXT";
    let content = message.text || "";

    if (message.attachments) {
      const attachment = message.attachments[0];
      if (attachment) {
        type = attachment.type.toUpperCase();
        content = attachment.payload.url;
      }
    }

    // Save message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        type,
        content,
        externalId: message.mid,
        status: "DELIVERED",
        sentAt: new Date(messaging.timestamp),
        metadata: message.reply_to ? { replyTo: message.reply_to.mid } : undefined,
      },
    });

    // Create deal activity if contact has active deals
    await createDealActivityForMessage(
      contact.id,
      content,
      message.mid
    );

    console.log(`[Instagram Webhook] Message saved from ${senderId}`);
  } catch (error) {
    console.error("[Instagram Webhook] Error handling message:", error);
  }
}

/**
 * Handle postback event
 */
async function handlePostback(instagramId: string, messaging: MessagingEvent) {
  // Handle button clicks or quick replies
  console.log("[Instagram Webhook] Postback received:", messaging.postback);
}
