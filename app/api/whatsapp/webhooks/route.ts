/**
 * WhatsApp Webhooks API Route
 * GET: Handle webhook verification (subscription setup)
 * POST: Receive webhook events from Meta and save to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promoteToLeadEngajado } from '@/lib/pipeline/lead-automation';
import {
  validateWebhookSignature,
  verifyWebhookChallenge,
  parseWebhookPayload,
  processWebhookPayload,
  dispatchEvents,
  type WebhookEventHandlers,
} from '@/lib/whatsapp/webhook-handler';

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
  let contact = await prisma.contact.findUnique({
    where: {
      organizationId_phone: {
        organizationId,
        phone,
      },
    },
  });

  if (!contact) {
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
  contactId: string
) {
  let conversation = await prisma.conversation.findFirst({
    where: {
      organizationId,
      contactId,
      status: 'active',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        contactId,
        status: 'active',
      },
    });
    console.log('[Webhook] Created new conversation:', conversation.id);
  }

  return conversation;
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
        console.warn('[Webhook] Missing signature header — rejecting');
        return NextResponse.json(
          { success: false, error: 'Missing signature header' },
          { status: 401 }
        );
      }

      const isValid = validateWebhookSignature(rawBody, signature, APP_SECRET);

      if (!isValid) {
        console.warn('[Webhook] Invalid signature');
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

    console.log('[Webhook] Received payload object:', payload.object);

    // Process the payload into individual events
    const events = processWebhookPayload(payload);
    const processedEvents: string[] = [];

    const handlers: WebhookEventHandlers = {
      onMessage: async ({ message, contact, phoneNumberId, displayPhoneNumber, timestamp }) => {
        console.log('[Webhook] onMessage:', { type: message.type, from: message.from, phoneNumberId, displayPhoneNumber });

        try {
          // Tenta encontrar a instância pelo phoneNumberId (mais preciso)
          // Fallback: pelo displayPhoneNumber (número exibido), que pode estar armazenado como phoneNumber ou displayPhoneNumber
          let instance = await prisma.whatsAppInstance.findFirst({
            where: { phoneNumberId },
          });

          if (!instance && displayPhoneNumber) {
            // Remove formatação para comparar (ex: "+55 11 99999-9999" → "5511999999999")
            const rawDisplay = displayPhoneNumber.replace(/\D/g, '');
            instance = await prisma.whatsAppInstance.findFirst({
              where: {
                OR: [
                  { displayPhoneNumber },
                  { phoneNumber: displayPhoneNumber },
                  { phoneNumber: rawDisplay },
                ],
              },
            });
            if (instance) {
              console.log('[Webhook] Instance found via displayPhoneNumber fallback:', instance.id);
              // Atualiza o phoneNumberId para evitar fallback nas próximas vezes
              await prisma.whatsAppInstance.update({
                where: { id: instance.id },
                data: { phoneNumberId },
              });
            }
          }

          if (!instance) {
            console.error('[Webhook] Instance not found for phoneNumberId:', phoneNumberId, 'displayPhoneNumber:', displayPhoneNumber);
            return;
          }

          // Save log
          await prisma.metaWebhookLog.create({
            data: {
              organizationId: instance.organizationId,
              whatsappInstanceId: instance.id,
              eventType: 'messages',
              payload: { message, contact, phoneNumberId, timestamp } as Record<string, unknown>,
              processed: true,
              processedAt: new Date(),
            },
          });

          const contactRecord = await findOrCreateContact(
            instance.organizationId,
            message.from,
            contact?.profile?.name
          );

          const ts = parseInt(String(timestamp));
          await prisma.contact.update({
            where: { id: contactRecord.id },
            data: {
              lastInteractionAt: !isNaN(ts) ? new Date(ts * 1000) : new Date(),
              ...(contact?.profile?.name ? { name: contact.profile.name } : {}),
            },
          });

          const conversation = await findOrCreateConversation(
            instance.organizationId,
            contactRecord.id
          );

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              contactId: contactRecord.id,
              messageId: message.id,
              direction: 'INBOUND',
              content: extractMessageText(message as Record<string, unknown>),
              status: 'delivered',
            },
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { unread_count: { increment: 1 } },
          });

          // Automação CRM: lead respondeu → promove para Lead Engajado
          await promoteToLeadEngajado(instance.organizationId, contactRecord.id);

          processedEvents.push(`message:${message.id}`);
          console.log('[Webhook] Message saved:', message.id);
        } catch (error) {
          console.error('[Webhook] Error processing message:', error);
          throw error;
        }
      },

      onStatus: async ({ status, phoneNumberId, displayPhoneNumber }) => {
        console.log('[Webhook] onStatus:', { messageId: status.id, status: status.status, phoneNumberId });

        try {
          let instance = await prisma.whatsAppInstance.findFirst({
            where: { phoneNumberId },
          });

          if (!instance && displayPhoneNumber) {
            const rawDisplay = displayPhoneNumber.replace(/\D/g, '');
            instance = await prisma.whatsAppInstance.findFirst({
              where: {
                OR: [
                  { displayPhoneNumber },
                  { phoneNumber: displayPhoneNumber },
                  { phoneNumber: rawDisplay },
                ],
              },
            });
          }

          if (!instance) {
            console.error('[Webhook] Instance not found for phoneNumberId:', phoneNumberId);
            return;
          }

          // Save log
          await prisma.metaWebhookLog.create({
            data: {
              organizationId: instance.organizationId,
              whatsappInstanceId: instance.id,
              eventType: 'statuses',
              payload: { status, phoneNumberId } as Record<string, unknown>,
              processed: true,
              processedAt: new Date(),
            },
          });

          const statusMap: Record<string, string> = {
            sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed',
          };

          const mappedStatus = statusMap[status.status];
          if (!mappedStatus) return;

          const existing = await prisma.message.findFirst({
            where: { messageId: status.id },
          });

          if (existing) {
            await prisma.message.update({
              where: { id: existing.id },
              data: { status: mappedStatus },
            });
            processedEvents.push(`status:${status.id}`);
          }
        } catch (error) {
          console.error('[Webhook] Error processing status:', error);
          throw error;
        }
      },

      onTemplateUpdate: async ({ template, phoneNumberId }) => {
        console.log('[Webhook] Template update:', { templateId: template.id, newStatus: template.status_update?.new_status });

        const instance = await prisma.whatsAppInstance.findFirst({ where: { phoneNumberId } });
        if (instance) {
          await prisma.metaWebhookLog.create({
            data: {
              organizationId: instance.organizationId,
              whatsappInstanceId: instance.id,
              eventType: 'message_template_status_update',
              payload: { template } as Record<string, unknown>,
              processed: true,
              processedAt: new Date(),
            },
          });
        }
        processedEvents.push(`template:${template.id}`);
      },

      onError: async ({ error, phoneNumberId }) => {
        console.error('[Webhook] Error event:', { code: error.code, title: error.title });

        const instance = phoneNumberId
          ? await prisma.whatsAppInstance.findFirst({ where: { phoneNumberId } })
          : null;

        if (instance) {
          await prisma.metaWebhookLog.create({
            data: {
              organizationId: instance.organizationId,
              whatsappInstanceId: instance.id,
              eventType: 'error',
              payload: { error } as Record<string, unknown>,
              processed: false,
              errorMessage: error.message || String(error.code),
            },
          });
        }
        processedEvents.push(`error:${error.code}`);
      },
    };

    // Dispatch events to handlers
    await dispatchEvents(events, handlers);

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
    return NextResponse.json(
      {
        success: false,
        error: 'Internal processing error',
      },
      { status: 200 }
    );
  }
}
