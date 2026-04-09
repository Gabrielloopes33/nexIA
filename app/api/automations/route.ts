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
 * GET /api/automations
 * Lista automações da organização
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const { searchParams } = new URL(request.url);
    
    const pipelineId = searchParams.get("pipelineId");
    const isActive = searchParams.get("isActive");

    console.log('[Automations GET] Params:', { organizationId, pipelineId, isActive });

    const result = await withRLS(prisma, organizationId, async (tx) => {
      const where: any = { organizationId };
      
      if (pipelineId) {
        where.triggerStage = {
          pipelineId,
        };
      }
      
      if (isActive !== null) {
        where.isActive = isActive === 'true';
      }

      const [automations, totalCount, activeCount] = await Promise.all([
        tx.pipelineAutomation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
            logs: {
              take: 1,
              orderBy: { startedAt: 'desc' },
              select: {
                status: true,
                errorMessage: true,
                startedAt: true,
              },
            },
          },
        }),
        tx.pipelineAutomation.count({ where }),
        tx.pipelineAutomation.count({ 
          where: { ...where, isActive: true } 
        }),
      ]);

      return { automations, totalCount, activeCount };
    });

    // Transforma os dados para o formato esperado
    const transformedAutomations = result.automations.map((automation) => {
      const conditions = automation.conditions as AutomationCondition[] | undefined;
      const actionConfig = automation.actionConfig as Record<string, any> | undefined;

      return {
        id: automation.id,
        name: automation.name,
        trigger: {
          pipelineId: automation.triggerStage?.pipelineId || '',
          stageId: automation.triggerStageId || '',
        } as AutomationTrigger,
        conditions: conditions || [],
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
        lastExecutedAt: automation.lastExecutionAt?.toISOString(),
        lastError: automation.logs[0]?.errorMessage || undefined,
        triggerPipeline: automation.triggerStage?.pipeline,
        triggerStage: automation.triggerStage,
        targetPipeline: automation.targetPipeline,
        targetStage: automation.targetStage,
        createdAt: automation.createdAt.toISOString(),
        updatedAt: automation.updatedAt.toISOString(),
      };
    });

    console.log('[Automations GET] Returning automations:', transformedAutomations.map(a => ({ id: a.id, name: a.name })));

    return NextResponse.json({
      success: true,
      data: {
        automations: transformedAutomations,
        totalCount: result.totalCount,
        activeCount: result.activeCount,
      },
    });
  } catch (error) {
    console.error("[Automations GET] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch automations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automations
 * Cria uma nova automação
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "Usuário não possui organização" },
        { status: 403 }
      );
    }
    
    const organizationId = user.organizationId;
    const body = await request.json();
    
    const {
      name,
      trigger,
      conditions = [],
      action,
    } = body;

    console.log('[Automations POST] Body:', body);
    console.log('[Automations POST] User:', { userId: user.userId, organizationId });

    // Validações
    if (!trigger?.stageId) {
      return NextResponse.json(
        { success: false, error: "Stage de gatilho é obrigatório" },
        { status: 400 }
      );
    }

    if (!action?.targetPipelineId || !action?.targetStageId) {
      return NextResponse.json(
        { success: false, error: "Pipeline e estágio de destino são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Verifica se o stage de gatilho existe e pertence à organização
      const triggerStage = await tx.pipelineStage.findFirst({
        where: { 
          id: trigger.stageId,
          organizationId,
        },
        include: {
          pipeline: { select: { id: true, name: true } },
        },
      });

      if (!triggerStage) {
        throw new Error("Estágio de gatilho não encontrado");
      }

      // Verifica se o pipeline de destino existe
      const targetPipeline = await tx.pipeline.findFirst({
        where: { 
          id: action.targetPipelineId,
          organizationId,
        },
      });

      if (!targetPipeline) {
        throw new Error("Pipeline de destino não encontrado");
      }

      // Verifica se o stage de destino existe
      const targetStage = await tx.pipelineStage.findFirst({
        where: { 
          id: action.targetStageId,
          pipelineId: action.targetPipelineId,
        },
      });

      if (!targetStage) {
        throw new Error("Estágio de destino não encontrado");
      }

      // Gera nome automático se não fornecido
      const automationName = name || 
        `Automação: ${triggerStage.name} → ${targetStage.name}`;

      // Cria a automação
      const automation = await tx.pipelineAutomation.create({
        data: {
          organizationId,
          name: automationName,
          description: body.description || null,
          triggerType: 'STAGE_ENTRY',
          triggerStageId: trigger.stageId,
          actionType: convertToPrismaActionType(action.type || 'move') as any,
          targetPipelineId: action.targetPipelineId,
          targetStageId: action.targetStageId,
          conditions: conditions as any,
          actionConfig: action.options || {},
          status: 'ACTIVE',
          isActive: true,
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
          createdBy: user.userId,
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

      return automation;
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

    console.log('[Automations POST] Created automation:', { id: transformedAutomation.id, name: transformedAutomation.name });

    return NextResponse.json({
      success: true,
      data: transformedAutomation,
    });
  } catch (error) {
    console.error("[Automations POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error) {
      if (error.message.includes("não encontrado")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
