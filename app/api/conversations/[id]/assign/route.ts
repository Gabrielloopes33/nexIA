/**
 * API de Atribuição de Conversas
 * POST: Atribui uma conversa a um agente
 * DELETE: Remove a atribuição de uma conversa
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers';

/**
 * POST /api/conversations/[id]/assign
 * Atribui uma conversa a um agente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id: conversationId } = await params;
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'ID do agente é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se a conversa existe e pertence à organização
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Verifica se o agente existe e pertence à organização
    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: agentId,
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Agente não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Atualiza a conversa com o novo assignee
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedTo: agentId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
      assignedTo: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
    });

  } catch (error: any) {
    console.error('[Assign Conversation] Erro:', error);

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { error: 'Erro interno ao atribuir conversa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]/assign
 * Remove a atribuição de uma conversa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id: conversationId } = await params;

    // Verifica se a conversa existe e pertence à organização
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Remove a atribuição
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedTo: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
    });

  } catch (error: any) {
    console.error('[Unassign Conversation] Erro:', error);

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { error: 'Erro interno ao remover atribuição' },
      { status: 500 }
    );
  }
}
