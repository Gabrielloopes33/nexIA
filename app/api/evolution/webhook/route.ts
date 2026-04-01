import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { promoteToLeadEngajado } from '@/lib/pipeline/lead-automation';

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

      case 'MESSAGES_UPDATE':
      case 'messages.update':
        await handleMessageUpdate(instance.id, event.data as Record<string, unknown>);
        break;

      case 'PRESENCE_UPDATE':
      case 'presence.update':
        await handlePresenceUpdate(instance.id, event.data as Record<string, unknown>);
        break;

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
  const pushName = data.pushName as string | undefined;
  
  // Get instance with organization
  const instance = await prisma.evolutionInstance.findUnique({
    where: { id: instanceId },
  });

  if (!instance) {
    console.warn('[Evolution Webhook] Instance not found:', instanceId);
    return;
  }

  // Extract phone from remoteJid (format: "5511999999999@s.whatsapp.net" ou "1203630...@g.us" para grupos)
  const remoteJid = key?.remoteJid as string;
  if (!remoteJid) {
    console.warn('[Evolution Webhook] No remoteJid in message key');
    return;
  }

  const phone = remoteJid.split('@')[0];
  const organizationId = instance.organizationId;
  const messageId = key?.id as string;

  // Verifica se é um grupo (grupos geralmente têm IDs começando com 12xxxxxx@g.us)
  const isGroup = remoteJid.endsWith('@g.us');

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

  // Mensagem enviada pelo próprio número (fromMe) — ex: ManyChat, outro sistema externo
  if (key?.fromMe) {
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: { messagesSent: { increment: 1 }, lastActivityAt: new Date() },
    });

    // Evita duplicata: se o CRM já salvou essa mensagem ao enviar, não salva de novo
    if (messageId) {
      const existing = await prisma.message.findFirst({ where: { messageId } });
      if (existing) {
        console.log('[Evolution Webhook] fromMe message already saved, skipping:', messageId);
        return;
      }
    }

    // Salva mensagem de saída enviada por ferramenta externa (ManyChat, etc.)
    try {
      const contact = await prisma.contact.findFirst({
        where: { organizationId, phone },
      });
      if (!contact) {
        console.log('[Evolution Webhook] fromMe: contact not found for phone', phone, '— skipping');
        return;
      }

      const conversation = await prisma.conversation.findFirst({
        where: { contactId: contact.id, organizationId, status: 'active' },
      });
      if (!conversation) {
        console.log('[Evolution Webhook] fromMe: no active conversation for contact', contact.id, '— skipping');
        return;
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: contact.id,
          content,
          status: 'sent',
          direction: 'OUTBOUND',
          messageId: messageId || undefined,
        },
      });
      console.log('[Evolution Webhook] Saved outbound (fromMe) message for conversation:', conversation.id);
    } catch (error) {
      console.error('[Evolution Webhook] Error saving fromMe message:', error);
    }
    return;
  }

  // Extrai o nome do contato/grupo
  let contactName: string | null = null;
  if (pushName && pushName.trim() && pushName !== phone) {
    contactName = pushName;
  } else if (isGroup) {
    const groupSubject = (messageData?.groupSubject as string) ||
                        (data.groupMetadata as Record<string, unknown>)?.subject as string ||
                        (data as Record<string, unknown>).subject as string;
    if (groupSubject) contactName = groupSubject;
  }

  console.log('[Evolution Webhook] Processing inbound message:', {
    phone,
    contactName,
    isGroup,
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
        ...(contactName ? { name: contactName } : {}),
      },
      create: {
        organizationId,
        phone,
        name: contactName,
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

    // Automação CRM: lead respondeu → promove para Lead Engajado
    await promoteToLeadEngajado(organizationId, contact.id);
  } catch (error) {
    console.error('[Evolution Webhook] Error saving inbound message:', error);
    throw error;
  }
}

async function handlePresenceUpdate(instanceId: string, data: Record<string, unknown>) {
  // Formatos possíveis da Evolution API:
  // { id: "phone@s.whatsapp.net", presences: { "phone@s.whatsapp.net": { lastKnownPresence: "composing" } } }
  // { remoteJid: "phone@s.whatsapp.net", presence: "composing" }
  const instance = await prisma.evolutionInstance.findUnique({ where: { id: instanceId } });
  if (!instance) return;

  let phone: string | null = null;

  if (data.id && typeof data.id === 'string') {
    phone = data.id.split('@')[0];
  } else if (data.remoteJid && typeof data.remoteJid === 'string') {
    phone = (data.remoteJid as string).split('@')[0];
  }

  if (!phone) {
    console.warn('[Evolution Webhook] Could not extract phone from presence update');
    return;
  }

  // You can emit this to connected clients via SSE or WebSocket
  console.log('[Evolution Webhook] Presence update:', { phone, data });
}

async function handleMessageUpdate(instanceId: string, data: Record<string, unknown>) {
  console.log('[Evolution Webhook] Message update received:', {
    instanceId,
    data,
  });
  
  // Evolution API v2 format for message updates
  // data.key.id = message ID
  // data.status = 'READ' | 'DELIVERY_ACK' | 'PENDING'
  
  const key = data.key as Record<string, unknown> | undefined;
  const status = data.status as string;
  
  if (!key?.id) {
    console.warn('[Evolution Webhook] No message ID in update');
    return;
  }
  
  const messageId = key.id as string;
  
  // Map Evolution status to our status
  const statusMap: Record<string, string> = {
    'READ': 'READ',
    'DELIVERY_ACK': 'DELIVERED',
    'PENDING': 'SENT',
    'SERVER_ACK': 'SENT',
  };
  
  const mappedStatus = statusMap[status] || status;
  
  try {
    // Find and update message
    const message = await prisma.message.findFirst({
      where: { messageId },
    });
    
    if (message) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: mappedStatus,
          ...(mappedStatus === 'READ' ? { readAt: new Date() } : {}),
          ...(mappedStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
      });
      console.log(`[Evolution Webhook] Updated message ${messageId} status to ${mappedStatus}`);
    }
  } catch (error) {
    console.error('[Evolution Webhook] Error updating message status:', error);
  }
}
