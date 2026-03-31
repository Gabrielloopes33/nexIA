/**
 * Conversations API
 * GET: Listar conversas da organização
 * POST: Criar nova conversa
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth/server';

// GET /api/conversations?contactId=&status=&assignedTo=&limit=20
// Filtros de assignedTo:
//   - "me": conversas atribuídas ao usuário logado
//   - "unassigned": conversas não atribuídas (assignedTo IS NULL)
//   - "{userId}": conversas atribuídas a um agente específico
//   - "all" ou omitido: todas as conversas
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }
    
    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const status = searchParams.get('status') as any;
    const assignedTo = searchParams.get('assignedTo') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    const organizationId = user.organizationId;
    const userId = user.userId;
    
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

    // Filtro de atribuição
    if (assignedTo === 'me') {
      // Conversas atribuídas ao usuário logado
      where.assignedTo = userId;
    } else if (assignedTo === 'unassigned') {
      // Conversas não atribuídas
      where.assignedTo = null;
    } else if (assignedTo !== 'all' && assignedTo) {
      // Conversas atribuídas a um agente específico (por userId)
      where.assignedTo = assignedTo;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Enriquecer conversas usando batch queries (evita N+1 no connection pool)
    const conversationIds = conversations.map(c => c.id);
    const contactIds = [...new Set(conversations.map(c => c.contactId))];
    const assignedUserIds = [...new Set(
      conversations.map(c => (c as any).assignedTo).filter((id: any): id is string => !!id)
    )];

    // 6 queries totais independente do número de conversas
    const [
      contacts,
      lastMessages,
      messageCounts,
      assignedUsers,
      waInstance,
      evoInstance,
    ] = await Promise.all([
      // Todos os contatos em uma query
      prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, name: true, phone: true, avatarUrl: true, status: true, tags: true },
      }),

      // Última mensagem por conversa usando DISTINCT ON do PostgreSQL
      conversationIds.length > 0
        ? prisma.$queryRaw<Array<{
            id: string;
            conversation_id: string;
            content: string | null;
            direction: string | null;
            created_at: Date;
            status: string;
          }>>(Prisma.sql`
            SELECT DISTINCT ON (conversation_id)
              id, conversation_id, content, direction, created_at, status
            FROM messages
            WHERE conversation_id = ANY(${conversationIds}::uuid[])
            ORDER BY conversation_id, created_at DESC
          `)
        : Promise.resolve([]),

      // Contagem de mensagens por conversa em uma query
      conversationIds.length > 0
        ? prisma.message.groupBy({
            by: ['conversationId'],
            where: { conversationId: { in: conversationIds } },
            _count: { id: true },
          })
        : Promise.resolve([]),

      // Todos os usuários atribuídos em uma query
      assignedUserIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: assignedUserIds } },
            select: { id: true, name: true, email: true, avatarUrl: true },
          })
        : Promise.resolve([]),

      // Instância WhatsApp — uma query para toda a org
      prisma.whatsAppInstance.findFirst({
        where: { organizationId },
        select: { id: true, name: true, phoneNumber: true },
      }),

      // Instância Evolution — uma query para toda a org
      prisma.evolutionInstance.findFirst({
        where: { organizationId, status: 'CONNECTED' },
        select: { id: true, name: true, phoneNumber: true },
      }),
    ]);

    // Mapear resultados para lookup rápido por id
    const contactMap = new Map(contacts.map(c => [c.id, c]));
    const lastMessageMap = new Map(lastMessages.map(m => [m.conversation_id, m]));
    const messageCountMap = new Map(messageCounts.map(mc => [mc.conversationId, mc._count.id]));
    const userMap = new Map(assignedUsers.map(u => [u.id, u]));

    const instance = waInstance
      ? { id: waInstance.id, name: waInstance.name, displayPhoneNumber: waInstance.phoneNumber }
      : evoInstance
      ? { id: evoInstance.id, name: evoInstance.name, displayPhoneNumber: evoInstance.phoneNumber }
      : null;

    const now = new Date();

    const enrichedConversations = conversations.map(conv => {
      const contact = contactMap.get(conv.contactId) || {
        id: conv.contactId,
        name: 'Desconhecido',
        phone: '',
        status: 'active',
      };
      const lastMsg = lastMessageMap.get(conv.id);
      const messageCount = messageCountMap.get(conv.id) ?? 0;
      const assignedUser = (conv as any).assignedTo ? userMap.get((conv as any).assignedTo) ?? null : null;

      const windowEnd = new Date(conv.createdAt.getTime() + 24 * 60 * 60 * 1000);

      return {
        ...conv,
        contact,
        assignedTo: assignedUser
          ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email, avatarUrl: assignedUser.avatarUrl }
          : null,
        instance,
        messages: lastMsg
          ? [{ id: lastMsg.id, conversationId: lastMsg.conversation_id, content: lastMsg.content, direction: lastMsg.direction || 'OUTBOUND', createdAt: lastMsg.created_at, status: lastMsg.status }]
          : [],
        messageCount,
        lastMessageAt: lastMsg?.created_at || conv.createdAt,
        windowStart: conv.createdAt,
        windowEnd,
        isWindowActive: windowEnd > now,
        timeUntilWindowExpires: Math.max(0, windowEnd.getTime() - now.getTime()),
      };
    });

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
      const [messages, waInstance, evoInstance] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: existingConversation.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }),
        prisma.whatsAppInstance.findFirst({
          where: { organizationId },
          select: { id: true, name: true, phoneNumber: true },
        }),
        prisma.evolutionInstance.findFirst({
          where: { organizationId, status: 'CONNECTED' },
          select: { id: true, name: true, phoneNumber: true },
        }),
      ]);
      const instanceSrc = waInstance || evoInstance;
      const instance = instanceSrc ? { id: instanceSrc.id, name: instanceSrc.name, displayPhoneNumber: instanceSrc.phoneNumber } : null;
      
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
            direction: m.direction || 'OUTBOUND',
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

    // Resolve a instância a usar: prioridade para instanceId do body, depois oficial conectada, depois Evolution
    const [waInst, evoInst] = await Promise.all([
      prisma.whatsAppInstance.findFirst({
        where: { organizationId, status: 'CONNECTED' },
        select: { id: true, name: true, phoneNumber: true },
      }),
      prisma.evolutionInstance.findFirst({
        where: { organizationId, status: 'CONNECTED' },
        select: { id: true, name: true, phoneNumber: true },
      }),
    ]);
    const instSrc = waInst || evoInst;
    const resolvedInstanceId = instanceId || instSrc?.id || null;
    const instance = instSrc ? { id: instSrc.id, name: instSrc.name, displayPhoneNumber: instSrc.phoneNumber } : null;

    // Cria nova conversa (instanceId não existe no schema — instância é resolvida na hora de enviar)
    const conversation = await prisma.conversation.create({
      data: {
        organizationId,
        contactId,
        status: 'active',
      },
    });

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
        instance,
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
