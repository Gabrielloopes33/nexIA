/**
 * Conversations API
 * GET: Listar conversas da organização
 * POST: Criar nova conversa
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// GET /api/conversations?contactId=&status=&limit=20
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status') as any;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const organizationId = user.organizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    const where: any = {
      organizationId,
    };

    if (contactId) where.contactId = contactId;
    if (status) where.status = status;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Buscar contatos, instâncias e mensagens para enriquecer as conversas
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const [contact, messages, messageCount] = await Promise.all([
          prisma.contact.findUnique({
            where: { id: conv.contactId },
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          }),
          prisma.message.findMany({
            where: { conversationId: conv.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
          }),
          prisma.message.count({
            where: { conversationId: conv.id },
          }),
        ]);
        
        // Buscar instância do WhatsApp (se existir)
        let instance = null;
        // Tenta buscar em ambas as tabelas
        const waInstance = await prisma.whatsAppInstance.findFirst({
          where: { organizationId },
          select: { id: true, name: true, phoneNumber: true },
        });
        const evoInstance = await prisma.evolutionInstance.findFirst({
          where: { organizationId, status: 'CONNECTED' },
          select: { id: true, name: true, phoneNumber: true, profileName: true },
        });
        instance = waInstance ? {
          id: waInstance.id,
          name: waInstance.name,
          displayPhoneNumber: waInstance.phoneNumber,
        } : (evoInstance ? {
          id: evoInstance.id,
          name: evoInstance.name,
          displayPhoneNumber: evoInstance.phoneNumber,
        } : null);

        const now = new Date();
        // Janela de 24h para WhatsApp
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
            direction: m.contactId === conv.contactId ? 'INBOUND' : 'OUTBOUND',
          })),
          messageCount,
          lastMessageAt: messages[0]?.createdAt || conv.createdAt,
          windowStart: conv.createdAt,
          windowEnd,
          isWindowActive,
          timeUntilWindowExpires: Math.max(0, windowEnd.getTime() - now.getTime()),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedConversations,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Conversations GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Criar conversa
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const body = await request.json();

    const {
      contactId,
      instanceId,
      type,
      organizationId: bodyOrgId,
    } = body;

    // Validações
    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: contactId' },
        { status: 400 }
      );
    }

    // Busca organizationId do body (fallback para compatibilidade) ou sessão
    const organizationId = user.organizationId || bodyOrgId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    // Verifica se contato existe
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Verifica se já existe conversa ativa para este contato
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        contactId,
        organizationId,
        status: 'active',
      },
    });

    if (existingConversation) {
      // Enriquece a conversa existente
      const [messages, instance] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: existingConversation.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }),
        prisma.whatsAppInstance.findFirst({
          where: { organizationId },
          select: { id: true, name: true, phoneNumber: true },
        }),
      ]);
      
      const now = new Date();
      const windowEnd = new Date(existingConversation.createdAt.getTime() + 24 * 60 * 60 * 1000);
      
      return NextResponse.json({
        success: true,
        data: {
          ...existingConversation,
          contact: {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            avatarUrl: contact.avatarUrl,
            status: contact.status,
          },
          instance,
          messages: messages.map(m => ({
            ...m,
            direction: m.contactId === existingConversation.contactId ? 'INBOUND' : 'OUTBOUND',
          })),
          messageCount: await prisma.message.count({
            where: { conversationId: existingConversation.id },
          }),
          lastMessageAt: messages[0]?.createdAt || existingConversation.createdAt,
          windowStart: existingConversation.createdAt,
          windowEnd,
          isWindowActive: windowEnd > now,
          timeUntilWindowExpires: Math.max(0, windowEnd.getTime() - now.getTime()),
        },
        message: 'Existing active conversation found',
      });
    }

    // Cria nova conversa
    const conversation = await prisma.conversation.create({
      data: {
        organizationId,
        contactId,
        status: 'active',
      },
    });

    const [instance] = await Promise.all([
      prisma.whatsAppInstance.findFirst({
        where: { organizationId },
        select: { id: true, name: true, phoneNumber: true },
      }),
    ]);

    const now = new Date();
    const windowEnd = new Date(conversation.createdAt.getTime() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          avatarUrl: contact.avatarUrl,
          status: contact.status,
        },
        instance: instance ? {
          id: instance.id,
          name: instance.name,
          displayPhoneNumber: instance.phoneNumber,
        } : null,
        messages: [],
        messageCount: 0,
        lastMessageAt: conversation.createdAt,
        windowStart: conversation.createdAt,
        windowEnd,
        isWindowActive: true,
        timeUntilWindowExpires: windowEnd.getTime() - now.getTime(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Conversations POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
