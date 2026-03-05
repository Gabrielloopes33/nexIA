/**
 * WhatsApp Webhooks API Route
 * GET: Handle webhook verification (subscription setup)
 * POST: Receive webhook events from Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateWebhookSignature,
  verifyWebhookChallenge,
  parseWebhookPayload,
  processWebhookPayload,
  dispatchEvents,
  type WebhookEventHandlers,
  type ProcessedEvent,
} from '@/lib/whatsapp/webhook-handler';

// Environment variables should be set in production
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
 * POST /api/whatsapp/webhooks
 * Receive and process webhook events from Meta
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empty request body',
        },
        { status: 400 }
      );
    }

    // Validate webhook signature in production
    if (APP_SECRET) {
      const signature = request.headers.get('x-hub-signature-256') || '';

      if (!signature) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing signature header',
          },
          { status: 401 }
        );
      }

      const isValid = validateWebhookSignature(rawBody, signature, APP_SECRET);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid webhook signature',
          },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const payload = parseWebhookPayload(rawBody);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload',
        },
        { status: 400 }
      );
    }

    // Process the payload into individual events
    const events = processWebhookPayload(payload);

    // Define event handlers
    const handlers: WebhookEventHandlers = {
      onMessage: async ({ message, contact, phoneNumberId, timestamp }) => {
        console.log('Received message:', {
          type: message.type,
          from: message.from,
          phoneNumberId,
          timestamp,
          contactName: contact?.profile?.name,
        });

        // In production, implement your business logic here:
        // - Store message in database
        // - Trigger automated responses
        // - Notify connected clients via WebSocket
        // - etc.

        // Example: Store in database (pseudo-code)
        // await db.messages.create({
        //   data: {
        //     messageId: message.id,
        //     from: message.from,
        //     phoneNumberId,
        //     type: message.type,
        //     content: extractMessageText(message),
        //     timestamp,
        //     contactName: contact?.profile?.name,
        //     rawPayload: message,
        //   },
        // });
      },

      onStatus: async ({ status, phoneNumberId, timestamp }) => {
        console.log('Message status update:', {
          messageId: status.id,
          status: status.status,
          phoneNumberId,
          timestamp,
        });

        // In production, update message status in database
        // await db.messageStatuses.create({
        //   data: {
        //     messageId: status.id,
        //     status: status.status,
        //     phoneNumberId,
        //     recipientId: status.recipient_id,
        //     timestamp,
        //     conversation: status.conversation,
        //     pricing: status.pricing,
        //   },
        // });
      },

      onTemplateUpdate: async ({ template, phoneNumberId, timestamp }) => {
        console.log('Template update:', {
          templateId: template.id,
          name: template.name,
          newStatus: template.status_update?.new_status,
          phoneNumberId,
          timestamp,
        });

        // In production, update template status in database
        // await db.templates.update({
        //   where: { id: template.id },
        //   data: {
        //     status: template.status_update?.new_status,
        //     category: template.new_category,
        //     updatedAt: timestamp,
        //   },
        // });
      },

      onError: async ({ error, phoneNumberId, timestamp }) => {
        console.error('Webhook error:', {
          code: error.code,
          title: error.title,
          message: error.message,
          phoneNumberId,
          timestamp,
        });

        // In production, log errors for monitoring
        // await db.errorLogs.create({
        //   data: {
        //     code: error.code,
        //     title: error.title,
        //     message: error.message,
        //     phoneNumberId,
        //     timestamp,
        //   },
        // });
      },
    };

    // Dispatch events to handlers
    await dispatchEvents(events, handlers);

    // Return success response quickly (Meta expects 200 OK within 20 seconds)
    return NextResponse.json({
      success: true,
      data: {
        received: true,
        eventsProcessed: events.length,
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
