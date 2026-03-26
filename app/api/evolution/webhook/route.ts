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
      console.warn('[Evolution Webhook] Invalid webhook secret');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const body = await request.text();
    console.log('[Evolution Webhook] Raw body:', body.substring(0, 1000));

    const event: WebhookEvent = JSON.parse(body);

    console.log('[Evolution Webhook] Received:', {
      event: event.event,
      instance: event.instance,
      data: JSON.stringify(event.data).substring(0, 500),
    });

    // Find instance by name
    const instance = await prisma.evolutionInstance.findUnique({
      where: { instanceName: event.instance },
    });

    if (!instance) {
      console.warn('[Evolution Webhook] Instance not found:', event.instance);
      return NextResponse.json({ success: false, error: 'Instance not found' });
    }

    // Handle different event types (Evolution API v2 uses UPPERCASE events)
    switch (event.event) {
      case 'CONNECTION_UPDATE':
      case 'connection.update':
        await handleConnectionUpdate(instance.id, event.data as Record<string, unknown>);
        break;

      case 'MESSAGES_UPSERT':
      case 'messages.upsert': {
        // Evolution API pode enviar data como objeto único ou array de mensagens
        const rawData = event.data;
        if (Array.isArray(rawData)) {
          for (const msg of rawData) {
            await handleMessageReceived(instance.id, msg as Record<string, unknown>);
          }
        } else {
          await handleMessageReceived(instance.id, rawData as Record<string, unknown>);
        }
        break;
      }

      case 'QRCODE_UPDATED':
      case 'qrcode.updated':
        console.log('[Evolution Webhook] QR Code updated for instance:', instance.id);
        break;

      default:
        console.log('[Evolution Webhook] Unhandled event type:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Evolution Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleConnectionUpdate(instanceId: string, data: Record<string, unknown>) {
  console.log('[Evolution Webhook] Connection update data:', data);
  
  // Evolution API pode enviar o estado de diferentes formas
  // 1. data.state diretamente
  // 2. data.connectionState 
  // 3. Dentro de um objeto aninhado
  let state = data.state as string;
  
  if (!state && data.connectionState) {
    state = data.connectionState as string;
  }
  
  // Se não encontrou state, tenta buscar em outros campos possíveis
  if (!state && typeof data === 'object') {
    const possibleStateFields = ['state', 'connectionState', 'status', 'connectionStatus'];
    for (const field of possibleStateFields) {
      if (data[field] && typeof data[field] === 'string') {
        state = data[field] as string;
        break;
      }
    }
  }
  
  if (!state) {
    console.warn('[Evolution Webhook] Could not find state in data:', data);
    return;
  }
  
  const statusMap: Record<string, string> = {
    'open': 'CONNECTED',
    'connecting': 'CONNECTING',
    'close': 'DISCONNECTED',
    'closed': 'DISCONNECTED',
  };

  const mappedStatus = statusMap[state.toLowerCase()] || 'ERROR';
  
  console.log(`[Evolution Webhook] Updating instance ${instanceId} status: ${state} -> ${mappedStatus}`);

  try {
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: {
        status: mappedStatus,
        ...(mappedStatus === 'CONNECTED' ? { connectedAt: new Date() } : {}),
        ...(mappedStatus === 'DISCONNECTED' ? { disconnectedAt: new Date() } : {}),
        lastActivityAt: new Date(),
      },
    });
    console.log('[Evolution Webhook] Instance status updated successfully');
  } catch (error) {
    console.error('[Evolution Webhook] Error updating instance status:', error);
    throw error;
  }
}

async function handleMessageReceived(instanceId: string, data: Record<string, unknown>) {
  console.log('[Evolution Webhook] Message received:', {
    instanceId,
    hasKey: !!data.key,
    hasMessage: !!data.message,
  });
  
  const key = data.key as Record<string, unknown> | undefined;
  const messageData = data.message as Record<string, unknown> | undefined;
  
  if (key?.fromMe) {
    // Update sent counter for outbound messages
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: {
        messagesSent: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
    console.log('[Evolution Webhook] Outbound message counted');
    return;
  }

  // Get instance with organization
  const instance = await prisma.evolutionInstance.findUnique({
    where: { id: instanceId },
  });
  
  if (!instance) {
    console.warn('[Evolution Webhook] Instance not found:', instanceId);
    return;
  }

  // Extract phone from remoteJid (format: "5511999999999@s.whatsapp.net")
  const remoteJid = key?.remoteJid as string;
  if (!remoteJid) {
    console.warn('[Evolution Webhook] No remoteJid in message key');
    return;
  }
  
  const phone = remoteJid.split('@')[0];
  const organizationId = instance.organizationId;

  // Get message content - handle different message types
  let content = '';
  if (messageData?.conversation) {
    content = messageData.conversation as string;
  } else if (messageData?.extendedTextMessage?.text) {
    content = messageData.extendedTextMessage.text as string;
  } else if (messageData?.imageMessage?.caption) {
    content = `[Imagem] ${messageData.imageMessage.caption}`;
  } else if (messageData?.videoMessage) {
    content = '[Vídeo]';
  } else if (messageData?.audioMessage) {
    content = '[Áudio]';
  } else if (messageData?.documentMessage) {
    content = `[Documento] ${messageData.documentMessage.title || ''}`;
  } else {
    content = '[Mensagem não suportada]';
  }

  const messageId = key?.id as string;

  console.log('[Evolution Webhook] Processing inbound message:', {
    phone,
    content: content.substring(0, 50),
    messageId,
  });

  try {
    // Update received counter
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: {
        messagesReceived: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    // Find or create contact
    const contact = await prisma.contact.upsert({
      where: {
        organizationId_phone: {
          organizationId,
          phone,
        },
      },
      update: {
        lastInteractionAt: new Date(),
      },
      create: {
        organizationId,
        phone,
        name: phone,
        status: 'ACTIVE',
        lastInteractionAt: new Date(),
      },
    });

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        organizationId,
        status: 'active',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId,
          contactId: contact.id,
          status: 'active',
        },
      });
      console.log('[Evolution Webhook] Created new conversation:', conversation.id);
    }

    // Save message
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        content,
        status: 'RECEIVED',
        direction: 'INBOUND',
        messageId: messageId || undefined,
      },
    });

    console.log('[Evolution Webhook] Saved inbound message:', savedMessage.id);
  } catch (error) {
    console.error('[Evolution Webhook] Error saving inbound message:', error);
    throw error;
  }
}
