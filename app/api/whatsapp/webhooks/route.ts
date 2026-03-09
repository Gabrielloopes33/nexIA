/**
 * WhatsApp Webhooks API Route
 * GET: Handle webhook verification (subscription setup)
 * POST: Receive webhook events from Meta and save to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';
import {
  validateWebhookSignature,
  verifyWebhookChallenge,
  parseWebhookPayload,
  processWebhookPayload,
  dispatchEvents,
  type WebhookEventHandlers,
} from '@/lib/whatsapp/webhook-handler';
import { updateLeadScore } from '@/lib/pipeline/scoring';

// Environment variables
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

/**
 * GET /api/whatsapp/webhooks
 * Handle webhook verification challenge from Meta
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: hub.mode, hub.verify_token, hub.challenge',
        },
        { status: 400 }
      );
    }

    if (!WEBHOOK_VERIFY_TOKEN) {
      console.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook verification token not configured',
        },
        { status: 500 }
      );
    }

    const verifiedChallenge = verifyWebhookChallenge(
      { mode, token, challenge },
      WEBHOOK_VERIFY_TOKEN
    );

    if (verifiedChallenge === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook verification failed. Invalid token or mode.',
        },
        { status: 403 }
      );
    }

    // Return the challenge to confirm subscription
    return new NextResponse(verifiedChallenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Webhook Verification Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook verification failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Find or create contact
 */
async function findOrCreateContact(
  organizationId: string,
  phone: string,
  name?: string
) {
  // Try to find existing contact
  let contact = await prisma.contact.findUnique({
    where: {
      organizationId_phone: {
        organizationId,
        phone,
      },
    },
  });

  if (!contact) {
    // Create new contact
    contact = await prisma.contact.create({
      data: {
        organizationId,
        phone,
        name: name || null,
        status: 'ACTIVE',
      },
    });
    console.log('[Webhook] Created new contact:', contact.id);
  }

  return contact;
}

/**
 * Helper: Find or create active conversation
 */
async function findOrCreateConversation(
  organizationId: string,
  instanceId: string,
  contactId: string,
  type: 'USER_INITIATED' | 'BUSINESS_INITIATED' | 'REFERRAL_INITIATED'
) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  // Try to find active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      organizationId,
      contactId,
      status: 'ACTIVE',
      windowEnd: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        instanceId,
        contactId,
        type,
        status: 'ACTIVE',
        windowStart: now,
        windowEnd,
      },
    });
    console.log('[Webhook] Created new conversation:', conversation.id);
  }

  return conversation;
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
          type: 'WHATSAPP',
          title: 'Mensagem recebida via WhatsApp',
          content: messageText.slice(0, 200), // Limit to 200 chars
          metadata: {
            messageId,
            channel: 'WHATSAPP',
            preview: messageText.slice(0, 100),
          },
          scoreImpact: 2,
        },
      });

      // Update lead score
      const newScore = updateLeadScore(deal.leadScore, 'WHATSAPP');
      await prisma.deal.update({
        where: { id: deal.id },
        data: { leadScore: newScore },
      });

      console.log(`[Webhook] Created WHATSAPP activity for deal ${deal.id}, new score: ${newScore}`);
    }
  } catch (error) {
    console.error('[Webhook] Error creating deal activity:', error);
    // Don't throw - this is a secondary operation
  }
}

/**
 * Helper: Save WhatsApp log
 */
async function saveWhatsAppLog(
  instanceId: string,
  type: string,
  eventType: string | null,
  payload: object,
  processed: boolean = true,
  error?: string
) {
  try {
    await prisma.whatsAppLog.create({
      data: {
        instanceId,
        type,
        eventType,
        payload: payload as Record<string, unknown>,
        processed,
        processedAt: processed ? new Date() : null,
        error: error || null,
      },
    });
  } catch (err) {
    console.error('[Webhook] Failed to save log:', err);
  }
}

/**
 * Helper: Extract message text from different message types
 */
function extractMessageText(message: Record<string, unknown>): string {
  if (message.text && typeof message.text === 'object') {
    return (message.text as Record<string, string>).body || '';
  }
  
  if (message.image) return '[Imagem]';
  if (message.video) return '[Vídeo]';
  if (message.audio) return '[Áudio]';
  if (message.document) return '[Documento]';
  if (message.location) return '[Localização]';
  if (message.contacts) return '[Contato]';
  if (message.sticker) return '[Sticker]';
  
  return '[Mensagem não suportada]';
}

/**
 * Helper: Map message type from Meta to our enum
 */
function mapMessageType(type: string): 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'INTERACTIVE' {
  const typeMap: Record<string, typeof typeMap[keyof typeof typeMap]> = {
    text: 'TEXT',
    image: 'IMAGE',
    video: 'VIDEO',
    audio: 'AUDIO',
    voice: 'AUDIO',
    document: 'DOCUMENT',
    location: 'LOCATION',
    contacts: 'CONTACT',
    interactive: 'INTERACTIVE',
  };
  
  return typeMap[type] || 'TEXT';
}

/**
 * POST /api/whatsapp/webhooks
 * Receive and process webhook events from Meta
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();

  try {
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      );
    }

    // Validate webhook signature in production
    if (APP_SECRET) {
      const signature = request.headers.get('x-hub-signature-256') || '';

      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing signature header' },
          { status: 401 }
        );
      }

      const isValid = validateWebhookSignature(rawBody, signature, APP_SECRET);

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const payload = parseWebhookPayload(rawBody);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Process the payload into individual events
    const events = processWebhookPayload(payload);
    const processedEvents: string[] = [];

    // Define event handlers with database operations
    const handlers: WebhookEventHandlers = {
      onMessage: async ({ message, contact, phoneNumberId, timestamp }) => {
        console.log('[Webhook] Processing message:', {
          type: message.type,
          from: message.from,
          phoneNumberId,
          messageId: message.id,
        });

        try {
          // Find the WhatsApp instance by phoneNumberId
          const instance = await prisma.whatsAppInstance.findFirst({
            where: { phoneNumberId },
          });

          if (!instance) {
            console.error('[Webhook] Instance not found for phoneNumberId:', phoneNumberId);
            return;
          }

          // Save log
          await saveWhatsAppLog(
            instance.id,
            'message_received',
            'messages',
            { message, contact, phoneNumberId, timestamp }
          );

          // Find or create contact
          const contactRecord = await findOrCreateContact(
            instance.organizationId,
            message.from,
            contact?.profile?.name
          );

          // Update contact last interaction
          await prisma.contact.update({
            where: { id: contactRecord.id },
            data: {
              lastInteractionAt: new Date(timestamp),
              name: contact?.profile?.name || contactRecord.name,
            },
          });

          // Find or create conversation
          const conversation = await findOrCreateConversation(
            instance.organizationId,
            instance.id,
            contactRecord.id,
            'USER_INITIATED'
          );

          // Create message
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              contactId: contactRecord.id,
              messageId: message.id,
              direction: 'INBOUND',
              type: mapMessageType(message.type),
              content: extractMessageText(message as Record<string, unknown>),
              status: 'DELIVERED',
              deliveredAt: new Date(timestamp),
              metadata: message as unknown as Record<string, unknown>,
            },
          });

          // Update conversation
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessageAt: new Date(timestamp),
              messageCount: { increment: 1 },
            },
          });

          // Create deal activity if contact has active deals
          const messageText = extractMessageText(message as Record<string, unknown>);
          await createDealActivityForMessage(
            contactRecord.id,
            messageText,
            message.id
          );

          processedEvents.push(`message:${message.id}`);
          console.log('[Webhook] Message saved successfully');
        } catch (error) {
          console.error('[Webhook] Error processing message:', error);
          throw error;
        }
      },

      onStatus: async ({ status, phoneNumberId, timestamp }) => {
        console.log('[Webhook] Processing status update:', {
          messageId: status.id,
          status: status.status,
        });

        try {
          // Find the WhatsApp instance
          const instance = await prisma.whatsAppInstance.findFirst({
            where: { phoneNumberId },
          });

          if (!instance) {
            console.error('[Webhook] Instance not found for phoneNumberId:', phoneNumberId);
            return;
          }

          // Save log
          await saveWhatsAppLog(
            instance.id,
            'status_update',
            'message_status_updates',
            { status, phoneNumberId, timestamp }
          );

          // Map status to our enum
          const statusMap: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
            sent: 'SENT',
            delivered: 'DELIVERED',
            read: 'READ',
            failed: 'FAILED',
          };

          const mappedStatus = statusMap[status.status];

          if (!mappedStatus) {
            console.log('[Webhook] Unknown status:', status.status);
            return;
          }

          // Update message status
          const existingMessage = await prisma.message.findUnique({
            where: { messageId: status.id },
          });

          if (existingMessage) {
            const updateData: Record<string, unknown> = { status: mappedStatus };
            
            if (mappedStatus === 'SENT') updateData.sentAt = new Date(timestamp);
            if (mappedStatus === 'DELIVERED') updateData.deliveredAt = new Date(timestamp);
            if (mappedStatus === 'READ') updateData.readAt = new Date(timestamp);
            if (mappedStatus === 'FAILED') {
              updateData.failedAt = new Date(timestamp);
              updateData.failedReason = status.errors?.[0]?.message || 'Unknown error';
            }

            await prisma.message.update({
              where: { messageId: status.id },
              data: updateData,
            });

            processedEvents.push(`status:${status.id}`);
            console.log('[Webhook] Status updated successfully');
          } else {
            console.log('[Webhook] Message not found for status update:', status.id);
          }
        } catch (error) {
          console.error('[Webhook] Error processing status:', error);
          throw error;
        }
      },

      onTemplateUpdate: async ({ template, phoneNumberId, timestamp }) => {
        console.log('[Webhook] Processing template update:', {
          templateId: template.id,
          newStatus: template.status_update?.new_status,
        });

        try {
          // Find the WhatsApp instance
          const instance = await prisma.whatsAppInstance.findFirst({
            where: { phoneNumberId },
          });

          if (!instance) {
            console.error('[Webhook] Instance not found for phoneNumberId:', phoneNumberId);
            return;
          }

          // Save log
          await saveWhatsAppLog(
            instance.id,
            'template_update',
            'message_template_status_update',
            { template, phoneNumberId, timestamp }
          );

          // Update template status
          const statusMap: Record<string, string> = {
            APPROVED: 'APPROVED',
            REJECTED: 'REJECTED',
            PAUSED: 'PAUSED',
            DISABLED: 'DISABLED',
            PENDING: 'PENDING',
          };

          const newStatus = template.status_update?.new_status;
          if (newStatus && statusMap[newStatus]) {
            await prisma.whatsAppTemplate.updateMany({
              where: { templateId: template.id },
              data: {
                status: statusMap[newStatus] as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED',
                reason: template.status_update?.rejected_reason || null,
              },
            });

            processedEvents.push(`template:${template.id}`);
            console.log('[Webhook] Template updated successfully');
          }
        } catch (error) {
          console.error('[Webhook] Error processing template update:', error);
          throw error;
        }
      },

      onError: async ({ error, phoneNumberId, timestamp }) => {
        console.error('[Webhook] Processing error:', {
          code: error.code,
          title: error.title,
        });

        try {
          // Find the WhatsApp instance
          const instance = phoneNumberId 
            ? await prisma.whatsAppInstance.findFirst({
                where: { phoneNumberId },
              })
            : null;

          if (instance) {
            await saveWhatsAppLog(
              instance.id,
              'error',
              'error',
              { error, phoneNumberId, timestamp },
              true,
              error.message
            );
          }

          processedEvents.push(`error:${error.code}`);
        } catch (err) {
          console.error('[Webhook] Error saving error log:', err);
        }
      },
    };

    // Dispatch events to handlers
    await dispatchEvents(events, handlers);

    // Return success response quickly (Meta expects 200 OK within 20 seconds)
    return NextResponse.json({
      success: true,
      data: {
        received: true,
        eventsProcessed: processedEvents.length,
        eventsByType: events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Webhook Processing Error:', error);

    // Always return 200 to Meta to prevent retries for unexpected errors
    // Log the error internally for debugging
    return NextResponse.json(
      {
        success: false,
        error: 'Internal processing error',
      },
      { status: 200 }
    );
  }
}
