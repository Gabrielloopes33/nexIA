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

// Converte o tipo de ação do Prisma para o tipo do frontend
function convertActionType(prismaType: string): AutomationActionType {
  const map: Record<string, AutomationActionType> = {
    'MOVE': 'move',
    'COPY': 'copy',
    'CREATE': 'create',
  };
  return map[prismaType] || 'move';
}

// Tipo de gatilho
type TriggerType = 'STAGE_ENTRY' | 'STAGE_EXIT';

/**
 * Avalia as condições da automação contra o deal
 */
function evaluateConditions(deal: any, conditions: AutomationCondition[]): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    const { field, operator, value } = condition;
    let dealValue: any;

    // Mapeia campos especiais
    switch (field) {
      case 'value':
        dealValue = Number(deal.value) || 0;
        break;
      case 'assignee':
        dealValue = deal.assignedTo;
        break;
      case 'tags':
        dealValue = deal.tags || [];
        break;
      case 'priority':
        dealValue = deal.priority;
        break;
      case 'days_in_stage':
        // Calcula dias no estágio atual
        const lastStageChange = deal.stageHistory?.[0];
        if (lastStageChange?.enteredAt) {
          const days = Math.floor(
            (Date.now() - new Date(lastStageChange.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          dealValue = days;
        } else {
          dealValue = 0;
        }
        break;
      case 'source':
        dealValue = deal.source;
        break;
      default:
        dealValue = deal[field];
    }

    switch (operator) {
      case 'equals':
        if (Array.isArray(dealValue)) {
          return Array.isArray(value) 
            ? value.every(v => dealValue.includes(v))
            : dealValue.includes(value);
        }
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
 * Verifica se há loop de automações (evita execução infinita)
 */
async function hasAutomationLoop(
  tx: any,
  automation: any,
  dealId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  const key = `${automation.id}:${dealId}`;
  
  if (visited.has(key)) {
    return true;
  }
  
  visited.add(key);

  // Verifica se há uma automação que seria disparada pelo destino desta automação
  const nextAutomations = await tx.pipelineAutomation.findMany({
    where: {
      organizationId: automation.organizationId,
      isActive: true,
      triggerStageId: automation.targetStageId,
      id: { not: automation.id }, // Evita a mesma automação
    },
  });

  for (const nextAuto of nextAutomations) {
    const wouldCreateLoop = await hasAutomationLoop(tx, nextAuto, dealId, new Set(visited));
    if (wouldCreateLoop) {
      return true;
    }
  }

  return false;
}

/**
 * Executa a ação da automação
 */
async function executeAutomationAction(
  tx: any,
  automation: any,
  deal: any,
  userId: string | null
): Promise<{ success: boolean; resultDealId?: string; error?: string }> {
  const actionType = convertActionType(automation.actionType);
  const actionConfig = automation.actionConfig as Record<string, any> || {};
  const { targetPipelineId, targetStageId } = automation;

  const executorId = userId || deal.createdBy || automation.createdBy;

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

        // Atualiza histórico de estágios anteriores
        await tx.pipelineStageHistory.updateMany({
          where: { 
            dealId: deal.id,
            exitedAt: null,
          },
          data: {
            exitedAt: new Date(),
          },
        });

        // Cria registro no histórico de estágios
        await tx.pipelineStageHistory.create({
          data: {
            dealId: deal.id,
            fromStageId: previousData.stageId,
            toStageId: targetStageId,
            movedBy: executorId,
          },
        });

        // Cria atividade
        await tx.dealActivity.create({
          data: {
            dealId: deal.id,
            user_id: executorId,
            type: "STAGE_CHANGE",
            description: `Movido automaticamente pela automação "${automation.name}"`,
            metadata: {
              automationId: automation.id,
              previousStageId: previousData.stageId,
              newStageId: targetStageId,
              previousPipelineId: previousData.pipelineId,
              newPipelineId: targetPipelineId,
              trigger: 'automation',
            },
          },
        });

        return { success: true, resultDealId: updatedDeal.id };
      }

      case 'copy': {
        // Cria cópia do deal no novo estágio
        const { id: _, createdAt, updatedAt, ...dealData } = deal;
        
        const newDeal = await tx.deal.create({
          data: {
            ...dealData,
            pipelineId: targetPipelineId,
            stageId: targetStageId,
            title: actionConfig.copyTitleFormat 
              ? `${deal.title} (${actionConfig.copyTitleFormat})`
              : `${deal.title} (cópia)`,
            status: 'OPEN',
            createdBy: executorId,
            // Metadados linkando ao deal original
            metadata: {
              ...(dealData.metadata || {}),
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
            user_id: executorId,
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
            createdBy: executorId,
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
            user_id: executorId,
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
 * POST /api/automations/trigger
 * Endpoint chamado quando um deal muda de estágio
 * Verifica e executa automações associadas
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    
    const {
      dealId,
      triggerType = 'STAGE_ENTRY',
      stageId,
      previousStageId,
    } = body;

    console.log('[Automation Trigger POST] Body:', { dealId, triggerType, stageId, previousStageId, organizationId });

    // Validações
    if (!dealId) {
      return NextResponse.json(
        { success: false, error: "DealId é obrigatório" },
        { status: 400 }
      );
    }

    if (!stageId) {
      return NextResponse.json(
        { success: false, error: "StageId é obrigatório" },
        { status: 400 }
      );
    }

    const results = await withRLS(prisma, organizationId, async (tx) => {
      // Busca o deal com histórico
      const deal = await tx.deal.findFirst({
        where: { 
          id: dealId, 
          organizationId,
        },
        include: {
          stageHistory: {
            orderBy: { enteredAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!deal) {
        throw new Error("Negócio não encontrado");
      }

      // Busca automações ativas para este estágio e tipo de gatilho
      const automations = await tx.pipelineAutomation.findMany({
        where: {
          organizationId,
          isActive: true,
          triggerStageId: stageId,
          triggerType: triggerType as any,
        },
      });

      console.log(`[Automation Trigger POST] Found ${automations.length} automations for stage ${stageId}`);

      const executionResults: Array<{
        automationId: string;
        automationName: string;
        executed: boolean;
        skipped?: boolean;
        success?: boolean;
        error?: string;
        logId: string;
      }> = [];

      // Executa cada automação
      for (const automation of automations) {
        const execStartTime = Date.now();

        try {
          // Verifica loop
          const wouldLoop = await hasAutomationLoop(tx, automation, dealId);
          if (wouldLoop) {
            console.log(`[Automation Trigger POST] Loop detected for automation ${automation.id}, skipping`);
            
            const log = await tx.automationLog.create({
              data: {
                organizationId,
                automationId: automation.id,
                dealId: deal.id,
                triggerStageId: stageId,
                targetPipelineId: automation.targetPipelineId,
                targetStageId: automation.targetStageId,
                status: 'SKIPPED',
                actionType: automation.actionType,
                conditionsMatched: false,
                errorMessage: 'Loop de automação detectado',
                startedAt: new Date(),
                completedAt: new Date(),
                durationMs: Date.now() - execStartTime,
              },
            });

            executionResults.push({
              automationId: automation.id,
              automationName: automation.name,
              executed: false,
              skipped: true,
              error: 'Loop de automação detectado',
              logId: log.id,
            });

            continue;
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
              triggerStageId: stageId,
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

          // Se condições não atendidas, pula
          if (!conditionsMatched) {
            await tx.automationLog.update({
              where: { id: log.id },
              data: {
                completedAt: new Date(),
                durationMs: Date.now() - execStartTime,
              },
            });

            await tx.pipelineAutomation.update({
              where: { id: automation.id },
              data: {
                executionCount: { increment: 1 },
                lastExecutionAt: new Date(),
              },
            });

            executionResults.push({
              automationId: automation.id,
              automationName: automation.name,
              executed: false,
              skipped: true,
              logId: log.id,
            });

            continue;
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
              durationMs: Date.now() - execStartTime,
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

          executionResults.push({
            automationId: automation.id,
            automationName: automation.name,
            executed: true,
            success: executionResult.success,
            error: executionResult.error,
            logId: log.id,
          });

        } catch (execError) {
          const errorMsg = execError instanceof Error ? execError.message : 'Erro desconhecido';
          console.error(`[Automation Trigger POST] Error executing automation ${automation.id}:`, errorMsg);

          // Cria log de erro
          const errorLog = await tx.automationLog.create({
            data: {
              organizationId,
              automationId: automation.id,
              dealId: deal.id,
              triggerStageId: stageId,
              targetPipelineId: automation.targetPipelineId,
              targetStageId: automation.targetStageId,
              status: 'FAILED',
              actionType: automation.actionType,
              conditionsMatched: true,
              errorMessage: errorMsg,
              startedAt: new Date(execStartTime),
              completedAt: new Date(),
              durationMs: Date.now() - execStartTime,
            },
          });

          // Atualiza estatísticas
          await tx.pipelineAutomation.update({
            where: { id: automation.id },
            data: {
              executionCount: { increment: 1 },
              failureCount: { increment: 1 },
              lastExecutionAt: new Date(),
            },
          });

          executionResults.push({
            automationId: automation.id,
            automationName: automation.name,
            executed: true,
            success: false,
            error: errorMsg,
            logId: errorLog.id,
          });
        }
      }

      return {
        dealId,
        stageId,
        triggerType,
        automationsFound: automations.length,
        automationsExecuted: executionResults.filter(r => r.executed && r.success).length,
        automationsFailed: executionResults.filter(r => r.executed && !r.success).length,
        automationsSkipped: executionResults.filter(r => r.skipped).length,
        results: executionResults,
        executionTimeMs: Date.now() - startTime,
      };
    });

    console.log('[Automation Trigger POST] Execution completed:', {
      dealId,
      automationsFound: results.automationsFound,
      executed: results.automationsExecuted,
      failed: results.automationsFailed,
      skipped: results.automationsSkipped,
      executionTimeMs: results.executionTimeMs,
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.automationsExecuted} automações executadas com sucesso`,
    });
  } catch (error) {
    console.error("[Automation Trigger POST] Error:", error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    if (error instanceof Error && error.message === "Negócio não encontrado") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to trigger automations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
