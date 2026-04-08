'use server';

import { prisma } from '@/lib/prisma';
import { AutomationTriggerType, AutomationActionType, AutomationStatus, AutomationLogStatus, ActivityType } from '@prisma/client';

interface TriggerAutomationParams {
  dealId: string;
  previousStageId?: string;
  newStageId: string;
  triggerType: AutomationTriggerType;
  organizationId: string;
}

interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: string | number | boolean;
}

/**
 * Aciona automações quando um deal muda de estágio
 * Esta função é "fire and forget" - não bloqueia a resposta da API
 */
export async function triggerStageAutomations(params: TriggerAutomationParams) {
  const { dealId, newStageId, triggerType, organizationId } = params;
  
  try {
    // Buscar automações ativas para este estágio + triggerType
    const automations = await prisma.pipelineAutomation.findMany({
      where: {
        organizationId,
        triggerStageId: newStageId,
        triggerType,
        isActive: true,
        status: AutomationStatus.ACTIVE
      }
    });
    
    if (automations.length === 0) {
      console.log(`[Automation] Nenhuma automação encontrada para stage ${newStageId}, trigger ${triggerType}`);
      return;
    }
    
    console.log(`[Automation] Encontradas ${automations.length} automações para executar`);
    
    // Buscar deal completo
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { 
        contact: true, 
        stage: true,
        pipeline: true
      }
    });
    
    if (!deal) {
      console.error(`[Automation] Deal ${dealId} não encontrado`);
      return;
    }
    
    // Executar cada automação de forma sequencial para evitar conflitos
    for (const automation of automations) {
      try {
        await executeAutomation(automation, deal, organizationId);
      } catch (error) {
        console.error(`[Automation] Erro ao executar automação ${automation.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Automation] Erro no triggerStageAutomations:', error);
    // Não relançar o erro para não quebrar o fluxo principal
  }
}

async function executeAutomation(automation: any, deal: any, organizationId: string) {
  const startTime = Date.now();
  
  try {
    // Verificar condições
    const conditions = (automation.conditions as Condition[] | null) || [];
    const conditionsMatched = evaluateConditions(deal, conditions);
    
    if (!conditionsMatched) {
      // Criar log de skipped
      await prisma.automationLog.create({
        data: {
          organizationId,
          automationId: automation.id,
          dealId: deal.id,
          triggerStageId: automation.triggerStageId,
          targetPipelineId: automation.targetPipelineId,
          targetStageId: automation.targetStageId,
          status: AutomationLogStatus.SKIPPED,
          actionType: automation.actionType,
          conditionsMatched: false,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          durationMs: Date.now() - startTime
        }
      });
      console.log(`[Automation] Automação ${automation.id} ignorada - condições não atendidas`);
      return;
    }
    
    // Executar ação baseada no tipo
    const result = await performAutomationAction(automation, deal, organizationId);
    
    // Criar log de sucesso
    await prisma.automationLog.create({
      data: {
        organizationId,
        automationId: automation.id,
        dealId: deal.id,
        triggerStageId: automation.triggerStageId,
        targetPipelineId: automation.targetPipelineId,
        targetStageId: automation.targetStageId,
        status: AutomationLogStatus.SUCCESS,
        actionType: automation.actionType,
        conditionsMatched: true,
        previousData: { stageId: deal.stageId, pipelineId: deal.pipelineId },
        resultData: result,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime
      }
    });
    
    // Atualizar estatísticas da automação
    await prisma.pipelineAutomation.update({
      where: { id: automation.id },
      data: {
        executionCount: { increment: 1 },
        successCount: { increment: 1 },
        lastExecutionAt: new Date()
      }
    });
    
    console.log(`[Automation] Automação ${automation.id} executada com sucesso`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Criar log de falha
    await prisma.automationLog.create({
      data: {
        organizationId,
        automationId: automation.id,
        dealId: deal.id,
        triggerStageId: automation.triggerStageId,
        targetPipelineId: automation.targetPipelineId,
        targetStageId: automation.targetStageId,
        status: AutomationLogStatus.FAILED,
        actionType: automation.actionType,
        conditionsMatched: false,
        errorMessage,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime
      }
    });
    
    // Atualizar estatísticas
    await prisma.pipelineAutomation.update({
      where: { id: automation.id },
      data: {
        executionCount: { increment: 1 },
        failureCount: { increment: 1 },
        lastExecutionAt: new Date()
      }
    });
    
    throw error;
  }
}

function evaluateConditions(deal: any, conditions: Condition[]): boolean {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every((condition) => {
    const { field, operator, value } = condition;
    const dealValue = getFieldValue(deal, field);
    
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
        return String(dealValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains': 
        return !String(dealValue).toLowerCase().includes(String(value).toLowerCase());
      default: 
        return true;
    }
  });
}

function getFieldValue(deal: any, field: string): any {
  // Suporte para campos aninhados (ex: contact.name)
  const parts = field.split('.');
  let value = deal;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

async function performAutomationAction(automation: any, deal: any, organizationId: string) {
  const { actionType, targetPipelineId, targetStageId, actionConfig } = automation;
  const config = (actionConfig as Record<string, any>) || {};
  
  switch (actionType) {
    case AutomationActionType.MOVE: {
      // Verificar se o deal já está no estágio de destino
      if (deal.stageId === targetStageId && deal.pipelineId === targetPipelineId) {
        console.log(`[Automation] Deal ${deal.id} já está no estágio destino`);
        return { dealId: deal.id, skipped: true, reason: 'already_at_target' };
      }
      
      // Move o deal para o novo pipeline/stage
      const updatedDeal = await prisma.deal.update({
        where: { id: deal.id },
        data: {
          pipelineId: targetPipelineId,
          stageId: targetStageId,
          // Manter ou limpar campos conforme config
          ...(config.clearValue ? { value: 0 } : {}),
          updatedAt: new Date()
        }
      });
      
      // Criar atividade
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          user_id: automation.createdBy,
          type: ActivityType.STAGE_CHANGE,
          description: `Movido automaticamente via automação "${automation.name}"`,
          metadata: {
            automationId: automation.id,
            sourcePipelineId: deal.pipelineId,
            sourceStageId: deal.stageId,
            targetPipelineId,
            targetStageId
          }
        }
      });
      
      return { dealId: updatedDeal.id, newStageId: targetStageId, action: 'moved' };
    }
    
    case AutomationActionType.COPY: {
      // Cria cópia do deal
      const { id, createdAt, updatedAt, ...copyData } = deal;
      
      const newDeal = await prisma.deal.create({
        data: {
          organizationId: deal.organizationId,
          productId: deal.productId,
          contactId: deal.contactId,
          pipelineId: targetPipelineId,
          stageId: targetStageId,
          title: config.keepTitle ? copyData.title : `${copyData.title} (cópia)`,
          description: copyData.description,
          value: config.copyValue !== false ? copyData.value : 0,
          currency: copyData.currency || 'BRL',
          status: 'OPEN',
          priority: copyData.priority || 'MEDIUM',
          expectedCloseDate: copyData.expectedCloseDate,
          assignedTo: copyData.assignedTo,
          createdBy: automation.createdBy,
          tags: config.copyTags !== false ? copyData.tags : [],
          metadata: {
            ...((copyData.metadata as object) || {}),
            copiedFrom: deal.id,
            automationId: automation.id
          }
        }
      });
      
      // Criar atividade no deal original
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          user_id: automation.createdBy,
          type: ActivityType.NOTE,
          description: `[AUTO] Cópia criada via automação "${automation.name}"`,
          metadata: {
            automationId: automation.id,
            copiedDealId: newDeal.id
          }
        }
      });
      
      return { newDealId: newDeal.id, originalDealId: deal.id, action: 'copied' };
    }
    
    case AutomationActionType.CREATE: {
      // Cria novo deal relacionado
      const newDeal = await prisma.deal.create({
        data: {
          organizationId: deal.organizationId,
          productId: deal.productId,
          contactId: deal.contactId,
          pipelineId: targetPipelineId,
          stageId: targetStageId,
          title: config.title || `Follow up: ${deal.title}`,
          description: config.copyDescription ? deal.description : null,
          value: config.copyValue ? deal.value : 0,
          currency: deal.currency || 'BRL',
          status: 'OPEN',
          priority: deal.priority || 'MEDIUM',
          source: 'AUTOMATION',
          createdBy: automation.createdBy,
          tags: config.copyTags ? deal.tags : [],
          metadata: {
            parentDealId: deal.id,
            automationId: automation.id,
            createdVia: 'automation'
          }
        }
      });
      
      // Criar atividade no deal original
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          user_id: automation.createdBy,
          type: ActivityType.NOTE,
          description: `[AUTO] Novo negócio criado via automação "${automation.name}"`,
          metadata: {
            automationId: automation.id,
            createdDealId: newDeal.id
          }
        }
      });
      
      return { newDealId: newDeal.id, parentDealId: deal.id, action: 'created' };
    }
    
    default:
      throw new Error(`Tipo de ação desconhecido: ${actionType}`);
  }
}
