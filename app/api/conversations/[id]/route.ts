/**
 * Conversation Individual API
 * GET: Detalhes da conversa com mensagens
 * PATCH: Atualizar conversa (status)
 * DELETE: Fechar/deletar conversa
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface Params {
  params: Promise<{ id: string }>;
}

// Helper para buscar instância (WhatsApp oficial ou Evolution)
async function getInstanceForOrg(organizationId: string) {
  const [waInstance, evoInstance] = await Promise.all([
    prisma.whatsAppInstance.findFirst({
      where: { organizationId },
      select: { id: true, name: true, phoneNumber: true },
    }),
    prisma.evolutionInstance.findFirst({
      where: { organizationId, status: 'CONNECTED' },
      select: { id: true, name: true, phoneNumber: true },
    }),
  ]);
  const src = waInstance || evoInstance;
  return src ? { id: src.id, name: src.name, displayPhoneNumber: src.phoneNumber } : null;
}

// Helper para enriquecer conversa
async function enrichConversation(conv: any, organizationId: string) {
  const [contact, messages, messageCount, instance] = await Promise.all([
    prisma.contact.findUnique({
      where: { id: conv.contactId },
      select: {
        id: true,
        name: true,
        phone: true,
        avatarUrl: true,
        status: true,
        tags: true,
      },
    }),
    prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.message.count({
      where: { conversationId: conv.id },
    }),
    getInstanceForOrg(organizationId),
  ]);

  const now = new Date();
  const windowEnd = new Date(conv.createdAt.getTime() + 24 * 60 * 60 * 1000);
  const isWindowActive = windowEnd > now;

  return {
    ...conv,
    contact: contact || {
      id: conv.contactId,
      name: 'Desconhecido',
      phone: '',
      status: 'active',
    },
    instance,
    messages: messages.map(m => ({
      ...m,
      direction: m.direction || 'OUTBOUND',
    })),
    messageCount,
    unreadCount: conv.unread_count || 0,
    lastMessageAt: messages[messages.length - 1]?.createdAt || conv.createdAt,
    windowStart: conv.createdAt,
    windowEnd,
    isWindowActive,
    timeUntilWindowExpires: Math.max(0, windowEnd.getTime() - now.getTime()),
  };
}

// GET /api/conversations/[id]?messagesLimit=50
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { id } = await params;

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const enriched = await enrichConversation(conversation, organizationId);

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Conversation GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Atualizar conversa
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { id } = await params;
    const body = await request.json();
    const { status, unread_count, archived } = body;

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    // Verifica se conversa existe
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Atualiza
    const data: any = {};
    if (status) data.status = status;
    if (typeof unread_count === 'number') data.unread_count = unread_count;
    if (typeof archived === 'boolean') data.archived = archived;

    const conversation = await prisma.conversation.update({
      where: { id },
      data,
    });

    const enriched = await enrichConversation(conversation, organizationId);

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Conversation PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Deletar conversa
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { id } = await params;

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    // Verifica se conversa existe
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Conversation DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
