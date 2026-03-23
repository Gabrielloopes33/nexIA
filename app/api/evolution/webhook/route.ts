import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

interface WebhookEvent {
  event: string;
  instance: string;
  data: unknown;
}

// POST /api/evolution/webhook
export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret if configured
    const headersList = await headers();
    const webhookSecret = headersList.get('x-webhook-secret');
    const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const event: WebhookEvent = await request.json();

    console.log('Evolution webhook received:', {
      event: event.event,
      instance: event.instance,
    });

    // Find instance by name
    const instance = await prisma.evolutionInstance.findUnique({
      where: { instanceName: event.instance },
    });

    if (!instance) {
      console.warn('Instance not found for webhook:', event.instance);
      return NextResponse.json({ success: false, error: 'Instance not found' });
    }

    // Handle different event types
    switch (event.event) {
      case 'connection.update':
        await handleConnectionUpdate(instance.id, event.data as Record<string, unknown>);
        break;

      case 'messages.upsert':
        await handleMessageReceived(instance.id, event.data as Record<string, unknown>);
        break;

      case 'qrcode.updated':
        // QR Code was updated, could notify frontend via WebSocket
        console.log('QR Code updated for instance:', instance.id);
        break;

      default:
        console.log('Unhandled event type:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleConnectionUpdate(instanceId: string, data: Record<string, unknown>) {
  const state = data.state as string;
  
  const statusMap: Record<string, string> = {
    'open': 'CONNECTED',
    'connecting': 'CONNECTING',
    'close': 'DISCONNECTED',
  };

  const mappedStatus = statusMap[state] || 'ERROR';

  await prisma.evolutionInstance.update({
    where: { id: instanceId },
    data: {
      status: mappedStatus,
      ...(mappedStatus === 'CONNECTED' ? { connectedAt: new Date() } : {}),
      ...(mappedStatus === 'DISCONNECTED' ? { disconnectedAt: new Date() } : {}),
      lastActivityAt: new Date(),
    },
  });
}

async function handleMessageReceived(instanceId: string, data: Record<string, unknown>) {
  // Only process incoming messages (not from me)
  const key = data.key as Record<string, unknown> | undefined;
  
  if (key?.fromMe) {
    // Update sent counter for outbound messages
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: {
        messagesSent: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
    return;
  }

  // Update received counter for inbound messages
  await prisma.evolutionInstance.update({
    where: { id: instanceId },
    data: {
      messagesReceived: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });

  // TODO: Integrate with ConversationService to create/update conversations
  // This will be implemented in Phase 2
}
