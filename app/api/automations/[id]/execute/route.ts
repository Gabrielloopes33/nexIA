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
 * Avalia as condições da automação contra o deal
 */
function evaluateConditions(deal: any, conditions: AutomationCondition[]): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const { field, operator, value } = condition;
    const dealValue = deal[field];

    switch (operator) {
      case 'equals':
        return dealValue === value;
      case 'not_equals':
        return dealValue !== value;
      case 'greater_than':
        return Number(dealValue) > Number(value);
      case 'less_than':
        return Number(dealValue) < Number(value);
      case 'contains':
        return String(dealValue).includes(String(value));
      case 'not_contains':
        return !String(dealValue).includes(String(value));
      default:
        return true;
    }
  });
}

/**
 * Executa a ação da automação
 */
async function executeAutomationAction(
  tx: any,
  automation: any,
  deal: any,
  userId: string
): Promise<{ success: boolean; resultDealId?: string; error?: string }> {
  const actionType = convertActionType(automation.actionType);
  const actionConfig = automation.actionConfig as Record<string, any> || {};
  const { targetPipelineId, targetStageId } = automation;

  try {
    switch (actionType) {
      case 'move': {
        // Salva os dados anteriores
        const previousData = {
          pipelineId: deal.pipelineId,
          stageId: deal.stageId,
        };

        // Move o deal: atualiza pipelineId e stageId
        const updatedDeal = await tx.deal.update({
          where: { id: deal.id },
          data: {
            pipelineId: targetPipelineId,
            stageId: targetStageId,
            // Copia campos conforme actionConfig
            ...(actionConfig.copyValue === false && { value: deal.value }),
            ...(actionConfig.copyDescription === false && { description: deal.description }),
          },
        });

        // Cria registro no histórico de estágios
        await tx.pipelineStageHistory.create({
          data: {
            dealId: deal.id,
            fromStageId: previousData.stageId,
            toStageId: targetStageId,
            movedBy: userId,
          },
        });

        // Cria atividade
        await tx.dealActivity.create({
          data: {
            dealId: deal.id,
            user_id: userId,
            type: "STAGE_CHANGE",
            description: `Movido automaticamente pela automação "${automation.name}"`,
            metadata: {
              automationId: automation.id,
              previousStageId: previousData.stageId,
              newStageId: targetStageId,
              previousPipelineId: previousData.pipelineId,
              newPipelineId: targetPipelineId,
            },
          },
        });

        return { success: true, resultDealId: updatedDeal.id };
      }

      case 'copy': {
        // Cria cópia do deal no novo estágio
        const { id: _, createdAt, updatedAt, stageHistory, ...dealData } = deal;
        
        const newDeal = await tx.deal.create({
          data: {
            ...dealData,
            pipelineId: targetPipelineId,
            stageId: targetStageId,
            title: actionConfig.copyTitleFormat 
              ? `${deal.title} (${actionConfig.copyTitleFormat})`
              : `${deal.title} (cópia)`,
            status: 'OPEN',
            createdBy: userId,
            // Metadados linkando ao deal original
            metadata: {
              ...dealData.metadata,
              copiedFromDealId: deal.id,
              copiedByAutomationId: automation.id,
              copiedAt: new Date().toISOString(),
            },
          },
        });

        // Cria atividade no deal original
        await tx.dealActivity.create({
          data: {
            dealId: deal.id,
            user_id: userId,
            type: "DEAL_CREATED",
            description: `Negócio copiado pela automação "${automation.name}"`,
            metadata: {
              automationId: automation.id,
              copiedDealId: newDeal.id,
              targetPipelineId,
              targetStageId,
            },
          },
        });

        // Cria atividade no novo deal
        await tx.dealActivity.create({
          data: {
            dealId: newDeal.id,
            user_id: userId,
            type: "DEAL_CREATED",
            description: `Negócio criado automaticamente pela automação "${automation.name}" (cópia de ${deal.title})`,
            metadata: {
              automationId: automation.id,
              originalDealId: deal.id,
              sourcePipelineId: deal.pipelineId,
              sourceStageId: deal.stageId,
            },
          },
        });

        return { success: true, resultDealId: newDeal.id };
      }

      case 'create': {
        // Cria novo deal relacionado
        const newDeal = await tx.deal.create({
          data: {
            organizationId: deal.organizationId,
            contactId: deal.contactId,
            pipelineId: targetPipelineId,
            stageId: targetStageId,
            title: actionConfig.newDealTitle || `Follow up: ${deal.title}`,
            value: actionConfig.newDealValue || 0,
            status: 'OPEN',
            createdBy: userId,
            priority: deal.priority || 'MEDIUM',
            currency: deal.currency || 'BRL',
            // Metadados linkando ao deal original
            metadata: {
              createdByAutomationId: automation.id,
              relatedToDealId: deal.id,
              createdAt: new Date().toISOString(),
              source: 'automation',
            },
          },
        });

        // Cria atividade no deal original
        await tx.dealActivity.create({
          data: {
            dealId: deal.id,
            user_id: userId,
            type: "TASK",
            description: `Novo negócio criado automaticamente pela automação "${automation.name}"`,
            metadata: {
              automationId: automation.id,
              createdDealId: newDeal.id,
              targetPipelineId,
              targetStageId,
            },
          },
        });

        // Cria atividade no novo deal
        await tx.dealActivity.create({
          data: {
            dealId: newDeal.id,
            user_id: userId,
            type: "DEAL_CREATED",
            description: `Negócio criado automaticamente pela automação "${automation.name}" (relacionado a ${deal.title})`,
            metadata: {
              automationId: automation.id,
              relatedDealId: deal.id,
            },
          },
        });

        return { success: true, resultDealId: newDeal.id };
      }

      default:
        return { success: false, error: `Tipo de ação desconhecido: ${actionType}` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido na execução' 
    };
  }
}

/**
 * POST /api/automations/[id]/execute
 * Executa manualmente uma automação para um deal
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
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
    
    const { dealId } = body;

    console.log('[Automation Execute POST] Params:', { id, dealId, organizationId });

    // Validação
    if (!dealId) {
      return NextResponse.json(
        { success: false, error: "DealId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await withRLS(prisma, organizationId, async (tx) => {
      // Busca a automação
      const automation = await tx.pipelineAutomation.findFirst({
        where: { 
          id, 
          organizationId,
          isActive: true,
        },
      });

      if (!automation) {
        throw new Error("Automação não encontrada ou inativa");
      }

      // Busca o deal
      const deal = await tx.deal.findFirst({
        where: { 
          id: dealId, 
          organizationId,
        },
      });

      if (!deal) {
        throw new Error("Negócio não encontrado");
      }

      // Verifica condições
      const conditions = automation.conditions as AutomationCondition[] | undefined;
      const conditionsMatched = evaluateConditions(deal, conditions || []);

      // Cria log inicial
      const log = await tx.automationLog.create({
        data: {
          organizationId,
          automationId: automation.id,
          dealId: deal.id,
          triggerStageId: automation.triggerStageId,
          targetPipelineId: automation.targetPipelineId,
          targetStageId: automation.targetStageId,
          status: conditionsMatched ? 'PENDING' : 'SKIPPED',
          actionType: automation.actionType,
          conditionsMatched,
          previousData: {
            pipelineId: deal.pipelineId,
            stageId: deal.stageId,
            value: deal.value,
            status: deal.status,
          },
          startedAt: new Date(),
        },
      });

      // Se condições não atendidas, retorna
      if (!conditionsMatched) {
        await tx.pipelineAutomation.update({
          where: { id: automation.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutionAt: new Date(),
          },
        });

        return {
          executed: false,
          skipped: true,
          reason: 'Condições não atendidas',
          logId: log.id,
        };
      }

      // Executa a ação
      const executionResult = await executeAutomationAction(tx, automation, deal, user.userId);

      // Atualiza o log
      await tx.automationLog.update({
        where: { id: log.id },
        data: {
          status: executionResult.success ? 'SUCCESS' : 'FAILED',
          resultData: executionResult.success 
            ? { resultDealId: executionResult.resultDealId }
            : undefined,
          errorMessage: executionResult.error,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        },
      });

      // Atualiza estatísticas da automação
      await tx.pipelineAutomation.update({
        where: { id: automation.id },
        data: {
          executionCount: { increment: 1 },
          successCount: executionResult.success ? { increment: 1 } : undefined,
          failureCount: !executionResult.success ? { increment: 1 } : undefined,
          lastExecutionAt: new Date(),
        },
      });

      return {
        executed: true,
        success: executionResult.success,
        resultDealId: executionResult.resultDealId,
        error: executionResult.error,
        logId: log.id,
      };
    });

    console.log('[Automation Execute POST] Execution result:', { 
      automationId: id, 
      dealId,
      ...result 
    });

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        data: {
          automationId: id,
          dealId,
          executed: false,
          skipped: true,
          reason: result.reason,
          logId: result.logId,
        },
        message: `Automação não executada: ${result.reason}`,
      });
    }

    return NextResponse.json({
      success: result.success,
      data: {
        automationId: id,
        dealId,
        executed: result.executed,
        resultDealId: result.resultDealId,
        logId: result.logId,
      },
      message: result.success 
        ? "Automação executada com sucesso" 
        : `Falha na execução: ${result.error}`,
    });
  } catch (error) {
    console.error("[Automation Execute POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error) {
      if (error.message.includes("não encontrada") || error.message.includes("não encontrado")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to execute automation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
