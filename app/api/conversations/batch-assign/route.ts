/**
 * API de Atribuição em Lote de Conversas
 * POST: Atribui múltiplas conversas a um agente
 * DELETE: Remove a atribuição de múltiplas conversas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// Tamanho máximo de batch para evitar timeouts
const MAX_BATCH_SIZE = 100;

/**
 * POST /api/conversations/batch-assign
 * Atribui múltiplas conversas a um agente
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const organizationId = user.organizationId;
    const currentUserId = user.userId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { conversationIds, agentId } = body;

    // Validações
    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'conversationIds é obrigatório e deve ser um array' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'agentId é obrigatório' },
        { status: 400 }
      );
    }

    if (conversationIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Limite máximo de ${MAX_BATCH_SIZE} conversas por requisição` },
        { status: 400 }
      );
    }

    // Verifica se o usuário atual tem permissão para atribuir
    // ADMIN e MANAGER podem atribuir para qualquer um
    // AGENT só pode atribuir para si mesmo (assumir)
    const currentMember = await prisma.organizationMember.findFirst({
      where: {
        userId: currentUserId,
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado na organização' },
        { status: 403 }
      );
    }

    const canAssignToOthers = ['ADMIN', 'MANAGER'].includes(currentMember.role);
    const isSelfAssignment = agentId === currentUserId;

    if (!canAssignToOthers && !isSelfAssignment) {
      return NextResponse.json(
        { success: false, error: 'Permissão negada: você só pode atribuir conversas para si mesmo' },
        { status: 403 }
      );
    }

    // Verifica se o agente destino existe e pertence à organização
    const targetMember = await prisma.organizationMember.findFirst({
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

    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: 'Agente não encontrado ou inativo nesta organização' },
        { status: 404 }
      );
    }

    // Verifica se todas as conversas existem e pertencem à organização
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        organizationId,
      },
      select: {
        id: true,
        assignedTo: true,
      },
    });

    const foundIds = new Set(conversations.map(c => c.id));
    const notFoundIds = conversationIds.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Algumas conversas não foram encontradas',
          invalidIds: notFoundIds 
        },
        { status: 404 }
      );
    }

    // Atualiza todas as conversas em uma transação atômica
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.updateMany({
        where: {
          id: { in: conversationIds },
          organizationId,
        },
        data: {
          assignedTo: agentId,
          updatedAt: new Date(),
        },
      });

      return updated;
    });

    // Busca detalhes das conversas atualizadas
    const updatedConversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
      },
      select: {
        id: true,
        assignedTo: true,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      agent: {
        id: targetMember.user?.id || agentId,
        name: targetMember.user?.name || 'Agente',
        email: targetMember.user?.email || '',
      },
      assignments: updatedConversations.map(conv => ({
        conversationId: conv.id,
        assignedTo: conv.assignedTo,
        status: 'updated',
      })),
    });

  } catch (error: any) {
    console.error('[Batch Assign] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atribuir conversas', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/batch-assign
 * Remove a atribuição de múltiplas conversas
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const organizationId = user.organizationId;
    const currentUserId = user.userId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No organization selected' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { conversationIds } = body;

    // Validações
    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'conversationIds é obrigatório e deve ser um array' },
        { status: 400 }
      );
    }

    if (conversationIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Limite máximo de ${MAX_BATCH_SIZE} conversas por requisição` },
        { status: 400 }
      );
    }

    // Verifica permissões do usuário atual
    const currentMember = await prisma.organizationMember.findFirst({
      where: {
        userId: currentUserId,
        organizationId,
        status: 'ACTIVE',
      },
      select: {
        role: true,
      },
    });

    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado na organização' },
        { status: 403 }
      );
    }

    const canUnassignAny = ['ADMIN', 'MANAGER'].includes(currentMember.role);

    // Busca as conversas para verificar permissões
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        organizationId,
      },
      select: {
        id: true,
        assignedTo: true,
      },
    });

    const foundIds = new Set(conversations.map(c => c.id));
    const notFoundIds = conversationIds.filter(id => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Algumas conversas não foram encontradas',
          invalidIds: notFoundIds 
        },
        { status: 404 }
      );
    }

    // Se não é ADMIN/MANAGER, só pode desatribuir conversas atribuídas a si mesmo
    if (!canUnassignAny) {
      const notOwnConversations = conversations.filter(
        c => c.assignedTo !== currentUserId
      );

      if (notOwnConversations.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Permissão negada: você só pode remover atribuição das suas próprias conversas',
            forbiddenIds: notOwnConversations.map(c => c.id)
          },
          { status: 403 }
        );
      }
    }

    // Remove atribuição em transação atômica
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.updateMany({
        where: {
          id: { in: conversationIds },
          organizationId,
        },
        data: {
          assignedTo: null,
          updatedAt: new Date(),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} conversas desatribuídas com sucesso`,
    });

  } catch (error: any) {
    console.error('[Batch Unassign] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao remover atribuições', details: error.message },
      { status: 500 }
    );
  }
}
