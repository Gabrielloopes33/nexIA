import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DealPriority, DealStatus, ActivityType } from "@prisma/client";
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { 
  withPermission,
  permissionDeniedResponse,
  checkPermission,
  getCurrentMemberWithRole
} from '@/lib/auth/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function validateStagePipeline(stageId: string, pipelineId: string | null | undefined) {
  if (!pipelineId) return true;
  const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId }, select: { pipelineId: true } });
  return stage?.pipelineId === pipelineId;
}

/**
 * GET /api/pipeline/deals/[id]
 * Retorna detalhes de um deal
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            probability: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    // Verifica se o deal pertence à organização
    if (deal.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("[Pipeline Deal] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pipeline/deals/[id]
 * Atualiza deal (usado para mover estágio)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;
    const body = await request.json();
    const { stageId, contactId, status, title, description, value, priority, expectedCloseDate, metadata, productId, pipelineId } = body;

    // Get current deal to check stage change
    const currentDeal = await prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!currentDeal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 }
      );
    }

    // Verifica se o deal pertence à organização
    if (currentDeal.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Valida consistência entre stage e pipeline
    const targetStageId = stageId !== undefined ? stageId : currentDeal.stageId;
    const targetPipelineId = pipelineId !== undefined ? pipelineId : currentDeal.pipelineId;

    if ((stageId !== undefined || pipelineId !== undefined) && targetPipelineId) {
      const isValid = await validateStagePipeline(targetStageId, targetPipelineId);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "stageId does not belong to the given pipelineId" },
          { status: 400 }
        );
      }
    }

    // Update deal
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(stageId && { stageId }),
        ...(contactId && { contactId }),
        ...(status && { status: status as DealStatus }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value }),
        ...(priority && { priority: priority as DealPriority }),
        ...(expectedCloseDate && { expectedCloseDate: new Date(expectedCloseDate) }),
        ...(metadata && { metadata }),
        ...(productId !== undefined && { productId }),
        ...(pipelineId !== undefined && { pipelineId }),
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
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            probability: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        pipeline: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create activity if stage changed
    if (stageId && stageId !== currentDeal.stageId) {
      const newStage = await prisma.pipelineStage.findUnique({
        where: { id: stageId },
      });

      await prisma.dealActivity.create({
        data: {
          dealId: id,
          type: ActivityType.STAGE_CHANGE,
          title: "Mudança de estágio",
          content: `Movido de '${currentDeal.stage.name}' para '${newStage?.name}'`,
          metadata: {
            fromStageId: currentDeal.stageId,
            toStageId: stageId,
            fromStageName: currentDeal.stage.name,
            toStageName: newStage?.name,
          },
        },
      });
    }

    // Create activity if status changed to WON or LOST
    if (status && status !== currentDeal.status) {
      if (status === "WON") {
        await prisma.dealActivity.create({
          data: {
            dealId: id,
            type: ActivityType.SYSTEM,
            title: "Deal ganho",
            content: "Deal marcado como GANHO",
            metadata: { status: "WON" },
          },
        });
        await prisma.deal.update({
          where: { id },
          data: { actualCloseDate: new Date() },
        });
      } else if (status === "LOST") {
        await prisma.dealActivity.create({
          data: {
            dealId: id,
            type: ActivityType.SYSTEM,
            title: "Deal perdido",
            content: "Deal marcado como PERDIDO",
            metadata: { status: "LOST" },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("[Pipeline Deal] Error updating deal:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pipeline/deals/[id]
 * Remove um deal (requer permissão deals:delete - ADMIN+)
 */
export const DELETE = withPermission(
  'deals:delete',
  async (request: NextRequest, member, { params }: RouteParams) => {
    try {
      const { id } = await params;

      const deal = await prisma.deal.findUnique({
        where: { id },
      });

      if (!deal) {
        return NextResponse.json(
          { success: false, error: "Deal not found" },
          { status: 404 }
        );
      }

      // Verifica se o deal pertence à organização do usuário
      if (deal.organizationId !== member.organizationId) {
        return permissionDeniedResponse('Acesso negado a este deal');
      }

      await prisma.deal.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Deal deleted successfully",
      });
    } catch (error) {
      console.error("[Pipeline Deal] Error deleting deal:", error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to delete deal",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  }
);
