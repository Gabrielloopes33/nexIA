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

// Converte o tipo de ação do frontend para o tipo do Prisma
function convertToPrismaActionType(type: AutomationActionType): string {
  const map: Record<AutomationActionType, string> = {
    'move': 'MOVE',
    'copy': 'COPY',
    'create': 'CREATE',
  };
  return map[type] || 'MOVE';
}

/**
 * GET /api/automations/[id]
 * Retorna uma automação específica
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    console.log('[Automation GET] Params:', { id, organizationId });

    const automation = await withRLS(prisma, organizationId, async (tx) => {
      return tx.pipelineAutomation.findFirst({
        where: { 
          id,
          organizationId,
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
            select: { id: true, name: true, color: true },
          },
          targetStage: {
            select: { id: true, name: true, color: true },
          },
          logs: {
            take: 5,
            orderBy: { startedAt: 'desc' },
            select: {
              id: true,
              status: true,
              dealId: true,
              errorMessage: true,
              startedAt: true,
              completedAt: true,
            },
          },
        },
      });
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: "Automação não encontrada" },
        { status: 404 }
      );
    }

    // Transforma para o formato esperado
    const actionConfig = automation.actionConfig as Record<string, any> | undefined;
    const transformedAutomation = {
      id: automation.id,
      name: automation.name,
      trigger: {
        pipelineId: automation.triggerStage?.pipelineId || '',
        stageId: automation.triggerStageId || '',
      } as AutomationTrigger,
      conditions: (automation.conditions as AutomationCondition[]) || [],
      action: {
        type: convertActionType(automation.actionType),
        targetPipelineId: automation.targetPipelineId,
        targetStageId: automation.targetStageId,
        options: {
          keepAssignee: actionConfig?.keepAssignee ?? true,
          copyTags: actionConfig?.copyTags ?? true,
          copyHistory: actionConfig?.copyHistory ?? false,
          copyValue: actionConfig?.copyValue ?? true,
          copyDescription: actionConfig?.copyDescription ?? true,
        },
      } as AutomationAction,
      isActive: automation.isActive,
      organizationId: automation.organizationId,
      executionCount: automation.executionCount,
      successCount: automation.successCount,
      failureCount: automation.failureCount,
      lastExecutedAt: automation.lastExecutionAt?.toISOString(),
      lastError: automation.logs[0]?.errorMessage || undefined,
      triggerPipeline: automation.triggerStage?.pipeline,
      triggerStage: automation.triggerStage,
      targetPipeline: automation.targetPipeline,
      targetStage: automation.targetStage,
      recentLogs: automation.logs,
      createdAt: automation.createdAt.toISOString(),
      updatedAt: automation.updatedAt.toISOString(),
    };

    console.log('[Automation GET] Returning automation:', { id: transformedAutomation.id, name: transformedAutomation.name });

    return NextResponse.json({
      success: true,
      data: transformedAutomation,
    });
  } catch (error) {
    console.error("[Automation GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/automations/[id]
 * Atualiza uma automação
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    
    const {
      name,
      trigger,
      conditions,
      action,
      isActive,
    } = body;

    console.log('[Automation PATCH] Params:', { id, organizationId });
    console.log('[Automation PATCH] Body:', body);

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se a automação existe
      const existingAutomation = await tx.pipelineAutomation.findFirst({
        where: { id, organizationId },
      });

      if (!existingAutomation) {
        throw new Error("Automação não encontrada");
      }

      // Validações se estiver atualizando o stage de gatilho
      if (trigger?.stageId) {
        const triggerStage = await tx.pipelineStage.findFirst({
          where: { 
            id: trigger.stageId,
            organizationId,
          },
        });

        if (!triggerStage) {
          throw new Error("Estágio de gatilho não encontrado");
        }
      }

      // Validações se estiver atualizando o destino
      if (action?.targetPipelineId) {
        const targetPipeline = await tx.pipeline.findFirst({
          where: { 
            id: action.targetPipelineId,
            organizationId,
          },
        });

        if (!targetPipeline) {
          throw new Error("Pipeline de destino não encontrado");
        }
      }

      if (action?.targetStageId) {
        const targetPipelineId = action.targetPipelineId || existingAutomation.targetPipelineId;
        const targetStage = await tx.pipelineStage.findFirst({
          where: { 
            id: action.targetStageId,
            pipelineId: targetPipelineId,
          },
        });

        if (!targetStage) {
          throw new Error("Estágio de destino não encontrado");
        }
      }

      // Prepara os dados de atualização
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (trigger?.stageId !== undefined) updateData.triggerStageId = trigger.stageId;
      if (conditions !== undefined) updateData.conditions = conditions;
      if (isActive !== undefined) {
        updateData.isActive = isActive;
        updateData.status = isActive ? 'ACTIVE' : 'PAUSED';
      }
      
      if (action) {
        if (action.type !== undefined) {
          updateData.actionType = convertToPrismaActionType(action.type);
        }
        if (action.targetPipelineId !== undefined) {
          updateData.targetPipelineId = action.targetPipelineId;
        }
        if (action.targetStageId !== undefined) {
          updateData.targetStageId = action.targetStageId;
        }
        if (action.options !== undefined) {
          const currentConfig = existingAutomation.actionConfig as Record<string, any> || {};
          updateData.actionConfig = { ...currentConfig, ...action.options };
        }
      }

      // Atualiza a automação
      const updatedAutomation = await tx.pipelineAutomation.update({
        where: { id },
        data: updateData,
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
            select: { id: true, name: true, color: true },
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

    console.log('[Automation PATCH] Updated automation:', { id: transformedAutomation.id, name: transformedAutomation.name });

    return NextResponse.json({
      success: true,
      data: transformedAutomation,
    });
  } catch (error) {
    console.error("[Automation PATCH] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error) {
      if (error.message.includes("não encontrada")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes("não encontrado")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automations/[id]
 * Remove uma automação
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    console.log('[Automation DELETE] Params:', { id, organizationId });

    await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se a automação existe
      const existingAutomation = await tx.pipelineAutomation.findFirst({
        where: { id, organizationId },
      });

      if (!existingAutomation) {
        throw new Error("Automação não encontrada");
      }

      // Deleta a automação (e seus logs em cascata)
      await tx.pipelineAutomation.delete({
        where: { id },
      });
    });

    console.log('[Automation DELETE] Deleted automation:', { id });

    return NextResponse.json({
      success: true,
      message: "Automação removida com sucesso",
    });
  } catch (error) {
    console.error("[Automation DELETE] Error:", error);
    
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
        error: "Failed to delete automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
