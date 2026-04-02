import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/server";
import { decrypt } from "@/lib/crypto";
import { config } from "@/lib/instagram/config";

/**
 * POST /api/instagram/messages/send
 * Envia mensagem via Instagram Direct API
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const { instanceId, recipientId, message } = body;

    if (!instanceId || !recipientId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: instanceId, recipientId, message" },
        { status: 400 }
      );
    }

    // Get instance
    const instance = await prisma.instagramInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: "Instance not found" },
        { status: 404 }
      );
    }

    if (instance.status !== "CONNECTED") {
      return NextResponse.json(
        { success: false, error: "Instance not connected" },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decrypt(instance.accessToken);

    // Send message to Instagram API
    const result = await sendInstagramMessage(
      instance.instagramId,
      recipientId,
      message,
      accessToken
    );

    // Find or create contact
    const contact = await prisma.contact.upsert({
      where: {
        organizationId_externalId_channel: {
          organizationId: instance.organizationId,
          externalId: recipientId,
          channel: "INSTAGRAM",
        },
      },
      update: { lastActivityAt: new Date() },
      create: {
        organizationId: instance.organizationId,
        externalId: recipientId,
        channel: "INSTAGRAM",
        name: recipientId,
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
        windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Busca dados do usuário atual para metadata
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true },
    });

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        type: message.text ? "TEXT" : "UNKNOWN",
        content: message.text || JSON.stringify(message),
        externalId: result.message_id,
        status: "SENT",
        sentAt: new Date(),
        metadata: currentUser ? {
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
        } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.message_id,
        dbMessageId: savedMessage.id,
      },
    });
  } catch (error) {
    console.error("[Instagram Send] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to send Instagram message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Send message via Instagram Messaging API
 */
async function sendInstagramMessage(
  instagramId: string,
  recipientId: string,
  message: { text?: string; attachment?: unknown },
  accessToken: string
): Promise<{ message_id: string }> {
  const url = `https://graph.facebook.com/${config.graphApiVersion}/${instagramId}/messages`;

  const payload: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: {},
  };

  if (message.text) {
    payload.message = { text: message.text };
  } else if (message.attachment) {
    payload.message = { attachment: message.attachment };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram API error: ${data.error?.message || JSON.stringify(data)}`);
  }

  return data;
}
