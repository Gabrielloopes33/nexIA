/**
 * Conversation Individual API
 * GET: Detalhes da conversa com mensagens
 * PATCH: Atualizar conversa (status, janela)
 * DELETE: Fechar/deletar conversa
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id]?messagesLimit=50
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const messagesLimit = Math.min(parseInt(searchParams.get('messagesLimit') || '50'), 100);

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
            status: true,
            metadata: true,
          },
        },
        instance: {
          select: {
            id: true,
            name: true,
            displayPhoneNumber: true,
            verifiedName: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: messagesLimit,
          include: {
            template: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Adicionar flag se a janela está ativa
    const now = new Date();
    const conversationWithWindowStatus = {
      ...conversation,
      isWindowActive: conversation.windowEnd > now,
      timeUntilWindowExpires: Math.max(0, conversation.windowEnd.getTime() - now.getTime()),
    };

    return NextResponse.json({
      success: true,
      data: conversationWithWindowStatus,
    });
  } catch (error) {
    console.error('Conversation GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Verifica se existe
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const { status, windowStart, windowEnd } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (windowStart) updateData.windowStart = new Date(windowStart);
    if (windowEnd) updateData.windowEnd = new Date(windowEnd);

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Conversation PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verifica se existe
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organization.id,
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
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Conversation DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
