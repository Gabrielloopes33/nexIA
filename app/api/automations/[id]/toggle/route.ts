import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRLS } from "@/lib/db/rls";
import { 
  getAuthenticatedUser,
  AuthError, 
  createAuthErrorResponse 
} from "@/lib/auth/helpers";
import type { 
  AutomationActionType,
  AutomationCondition,
  AutomationTrigger,
  AutomationAction,
} from "@/types/pipeline-config";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Converte o tipo de ação do Prisma para o tipo do frontend
function convertActionType(prismaType: string): AutomationActionType {
  const map: Record<string, AutomationActionType> = {
    'MOVE': 'move',
    'COPY': 'copy',
    'CREATE': 'create',
  };
  return map[prismaType] || 'move';
}

/**
 * POST /api/automations/[id]/toggle
 * Ativa/desativa uma automação
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const { id } = await params;
    const body = await request.json();
    
    const { isActive } = body;

    console.log('[Automation Toggle POST] Params:', { id, organizationId, isActive });

    // Validação
    if (isActive === undefined || isActive === null) {
      return NextResponse.json(
        { success: false, error: "Parâmetro isActive é obrigatório" },
        { status: 400 }
      );
    }

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se a automação existe
      const existingAutomation = await tx.pipelineAutomation.findFirst({
        where: { id, organizationId },
      });

      if (!existingAutomation) {
        throw new Error("Automação não encontrada");
      }

      // Atualiza o status
      const updatedAutomation = await tx.pipelineAutomation.update({
        where: { id },
        data: {
          isActive,
          status: isActive ? 'ACTIVE' : 'PAUSED',
        },
        include: {
          triggerStage: {
            select: { 
              id: true, 
              name: true, 
              color: true,
              pipelineId: true,
              pipeline: {
                select: { id: true, name: true },
              },
            },
          },
          targetPipeline: {
            select: { id: true, name: true },
          },
          targetStage: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      return updatedAutomation;
    });

    // Transforma para o formato esperado
    const actionConfig = result.actionConfig as Record<string, any> | undefined;
    const transformedAutomation = {
      id: result.id,
      name: result.name,
      trigger: {
        pipelineId: result.triggerStage?.pipelineId || '',
        stageId: result.triggerStageId || '',
      } as AutomationTrigger,
      conditions: (result.conditions as AutomationCondition[]) || [],
      action: {
        type: convertActionType(result.actionType),
        targetPipelineId: result.targetPipelineId,
        targetStageId: result.targetStageId,
        options: {
          keepAssignee: actionConfig?.keepAssignee ?? true,
          copyTags: actionConfig?.copyTags ?? true,
          copyHistory: actionConfig?.copyHistory ?? false,
          copyValue: actionConfig?.copyValue ?? true,
          copyDescription: actionConfig?.copyDescription ?? true,
        },
      } as AutomationAction,
      isActive: result.isActive,
      organizationId: result.organizationId,
      executionCount: result.executionCount,
      lastExecutedAt: result.lastExecutionAt?.toISOString(),
      triggerPipeline: result.triggerStage?.pipeline,
      triggerStage: result.triggerStage,
      targetPipeline: result.targetPipeline,
      targetStage: result.targetStage,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    console.log('[Automation Toggle POST] Toggled automation:', { 
      id: transformedAutomation.id, 
      name: transformedAutomation.name,
      isActive: transformedAutomation.isActive 
    });

    return NextResponse.json({
      success: true,
      data: transformedAutomation,
      message: isActive 
        ? "Automação ativada com sucesso" 
        : "Automação desativada com sucesso",
    });
  } catch (error) {
    console.error("[Automation Toggle POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error && error.message === "Automação não encontrada") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to toggle automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
