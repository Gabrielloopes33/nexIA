/**
 * Conversation Messages API
 * GET: Listar mensagens da conversa
 * POST: Enviar nova mensagem
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]/messages?limit=50&before=
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before'); // Cursor para paginação

    // Verifica se conversa existe e pertence à organização
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const where: any = {
      conversationId: id,
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            language: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Reverte para ordem cronológica
    messages.reverse();

    return NextResponse.json({
      success: true,
      data: messages,
      meta: {
        hasMore: messages.length === limit,
        nextCursor: messages.length > 0 ? messages[0].createdAt : null,
      },
    });
  } catch (error) {
    console.error('Messages GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Enviar mensagem
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const {
      content,
      type,
      mediaUrl,
      caption,
      templateId,
      metadata,
    } = body;

    // Verifica se conversa existe
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
      include: {
        contact: true,
        instance: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verifica se a janela de 24h está ativa
    const now = new Date();
    const isWindowActive = conversation.windowEnd > now;

    if (!isWindowActive && !templateId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Conversation window has expired. Use a template to reinitiate.',
          code: 'WINDOW_EXPIRED',
        },
        { status: 400 }
      );
    }

    // Validações
    if (!content && !templateId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: content or templateId' },
        { status: 400 }
      );
    }

    // Cria a mensagem
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        contactId: conversation.contactId,
        content: content || '',
        type: type || 'TEXT',
        direction: 'OUTBOUND',
        mediaUrl,
        caption,
        templateId,
        metadata,
        status: 'SENT',
        sentAt: now,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Atualiza a conversa
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: now,
        messageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    }, { status: 201 });
  } catch (error) {
    console.error('Messages POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
