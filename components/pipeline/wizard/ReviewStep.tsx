/**
 * Review Step - Wizard de Automação
 * 
 * @module components/pipeline/wizard/ReviewStep
 * @description Step 4: Revisão e confirmação da automação
 */

'use client';

import { AutomationWizardState, Pipeline, AutomationAction, generateAutomationName, AUTOMATION_ACTION_LABELS, AUTOMATION_FIELD_LABELS, AUTOMATION_OPERATOR_LABELS } from '@/types/pipeline-config';
import { ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStepProps {
  state: AutomationWizardState;
  pipelines: Pipeline[];
}

/**
 * Step de revisão da automação
 */
export function ReviewStep({ state, pipelines = [] }: ReviewStepProps) {
  const triggerPipeline = pipelines.find(p => p.id === state.trigger.pipelineId);
  const triggerStage = triggerPipeline?.stages?.find(s => s.id === state.trigger.stageId);
  const targetPipeline = pipelines.find(p => p.id === state.action.targetPipelineId);
  const targetStage = targetPipeline?.stages?.find(s => s.id === state.action.targetStageId);

  const autoName = generateAutomationName(
    triggerStage?.name || 'Estágio',
    state.action.type || 'move',
    targetPipeline?.name || 'Pipeline'
  );

  const displayName = state.name || autoName;
  const options = (state.action.options || {}) as Partial<AutomationAction['options']>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Check className="w-4 h-4" />
        <span>Revise as configurações antes de criar a automação</span>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-1">{displayName}</h4>
        <p className="text-sm text-muted-foreground">
          Automação de {AUTOMATION_ACTION_LABELS[state.action.type || 'move']}
        </p>
      </div>

      <div className="flex items-center gap-4 flex-col sm:flex-row">
        <div className="flex-1 w-full p-4 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground uppercase mb-1 font-medium">Quando</div>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: triggerPipeline?.color }} 
            />
            <div className="font-medium">{triggerPipeline?.name || 'Pipeline não selecionado'}</div>
          </div>
          <div className="text-sm text-muted-foreground ml-4.5 pl-0.5">
            {triggerStage?.name || 'Estágio não selecionado'}
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-muted-foreground hidden sm:block" />

        <div className={cn(
          "flex-1 w-full p-4 rounded-lg border",
          "bg-primary/5 border-primary"
        )}>
          <div className="text-xs text-primary uppercase mb-1 font-medium">Então</div>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: targetPipeline?.color }} 
            />
            <div className="font-medium">{targetPipeline?.name || 'Pipeline não selecionado'}</div>
          </div>
          <div className="text-sm text-muted-foreground ml-4.5 pl-0.5">
            {targetStage?.name || 'Estágio não selecionado'}
          </div>
          <div className="text-xs text-primary mt-2 font-medium">
            {AUTOMATION_ACTION_LABELS[state.action.type || 'move']}
          </div>
        </div>
      </div>

      {state.conditions && state.conditions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Condições</h4>
          <ul className="space-y-2">
            {state.conditions.map((condition, idx) => (
              <li 
                key={idx} 
                className="text-sm text-muted-foreground flex items-center gap-2 bg-muted p-2 rounded"
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  {AUTOMATION_FIELD_LABELS[condition.field]}{' '}
                  <span className="text-primary">
                    {AUTOMATION_OPERATOR_LABELS[condition.operator]}
                  </span>{' '}
                  <strong>{condition.value}</strong>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-medium text-sm">Opções Selecionadas</h4>
        <div className="flex flex-wrap gap-2">
          {options?.keepAssignee && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              Manter responsável
            </span>
          )}
          {options?.copyTags && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              Copiar tags
            </span>
          )}
          {options?.copyValue && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              Copiar valor
            </span>
          )}
          {options?.copyDescription && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              Copiar descrição
            </span>
          )}
          {options?.copyHistory && (
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              Copiar histórico
            </span>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800 font-medium">Importante</p>
          <p className="text-sm text-amber-700 mt-1">
            Esta automação será executada automaticamente sempre que um negócio entrar no estágio selecionado.
            Verifique as configurações para evitar loops de automação.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
