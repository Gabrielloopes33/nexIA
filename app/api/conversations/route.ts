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
    const { searchParams } = new URL(request.url);

    const contactId = searchParams.get('contactId');
    const instanceId = searchParams.get('instanceId');
    const status = searchParams.get('status') as any;
    const type = searchParams.get('type') as any;
    const active = searchParams.get('active'); // Conversas com janela ativa
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organization.id,
    };

    if (contactId) where.contactId = contactId;
    if (instanceId) where.instanceId = instanceId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (active === 'true') {
      where.windowEnd = { gte: new Date() };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
          instance: {
            select: {
              id: true,
              name: true,
              displayPhoneNumber: true,
              verifiedName: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              type: true,
              direction: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({ where }),
    ]);

    // Adicionar flag se a janela está ativa
    const now = new Date();
    const conversationsWithWindowStatus = conversations.map(conv => ({
      ...conv,
      isWindowActive: conv.windowEnd > now,
      timeUntilWindowExpires: Math.max(0, conv.windowEnd.getTime() - now.getTime()),
    }));

    return NextResponse.json({
      success: true,
      data: conversationsWithWindowStatus,
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
    const body = await request.json();

    const {
      contactId,
      instanceId,
      type,
      conversationId,
      windowStart,
      windowEnd,
    } = body;

    // Validações
    if (!contactId || !instanceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: contactId, instanceId' },
        { status: 400 }
      );
    }

    // Verifica se contato existe
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organization.id,
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
        instanceId,
        status: 'ACTIVE',
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        data: existingConversation,
        message: 'Existing active conversation found',
      });
    }

    // Cria nova conversa
    const now = new Date();
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: user.organization.id,
        contactId,
        instanceId,
        type: type || 'USER_INITIATED',
        conversationId,
        windowStart: windowStart ? new Date(windowStart) : now,
        windowEnd: windowEnd ? new Date(windowEnd) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        instance: {
          select: {
            id: true,
            name: true,
            displayPhoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
    }, { status: 201 });
  } catch (error) {
    console.error('Conversations POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
