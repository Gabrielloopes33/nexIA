/**
 * Wizard de Automação
 * 
 * @module components/pipeline/AutomationWizard
 * @description Modal com 4 steps para criar/editar automações de pipeline
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AutomationWizardProps, AutomationWizardState, CreateAutomationInput, AutomationTrigger, AutomationAction } from '@/types/pipeline-config';

// Steps
import { TriggerStep } from './wizard/TriggerStep';
import { ConditionsStep } from './wizard/ConditionsStep';
import { ActionStep } from './wizard/ActionStep';
import { ReviewStep } from './wizard/ReviewStep';

const STEP_LABELS = ['Gatilho', 'Condições', 'Ação', 'Revisar'] as const;

/**
 * Wizard de criação/edição de automações
 */
export function AutomationWizard({
  isOpen,
  onClose,
  onSave,
  automation,
  pipelines,
  isSaving = false
}: AutomationWizardProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<AutomationWizardState>({
    step: 1,
    trigger: {},
    conditions: [],
    action: { options: {} as AutomationAction['options'] },
    isValid: false,
    errors: {}
  });

  // Reset state when modal opens/closes or automation changes
  useEffect(() => {
    if (isOpen) {
      if (automation) {
        // Edit mode - populate with existing data
        setState({
          step: 1,
          name: automation.name,
          trigger: automation.trigger,
          conditions: automation.conditions || [],
          action: automation.action,
          isValid: true,
          errors: {}
        });
      } else {
        // Create mode - reset state
        setState({
          step: 1,
          trigger: {},
          conditions: [],
          action: { options: {} as AutomationAction['options'] },
          isValid: false,
          errors: {}
        });
      }
      setStep(1);
    }
  }, [isOpen, automation]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = async () => {
    const input: CreateAutomationInput = {
      name: state.name,
      trigger: state.trigger as AutomationTrigger,
      conditions: state.conditions,
      action: state.action as AutomationAction
    };
    await onSave(input);
    onClose();
  };

  const isStepValid = useCallback(() => {
    switch (step) {
      case 1:
        return !!state.trigger.pipelineId && !!state.trigger.stageId;
      case 2:
        // Conditions are optional, always valid
        return true;
      case 3:
        return !!state.action.type && !!state.action.targetPipelineId && !!state.action.targetStageId;
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, state]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {automation ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 mt-4">
          {STEP_LABELS.map((label, idx) => (
            <div key={label} className={`flex items-center ${idx > 0 ? 'flex-1' : ''}`}>
              {idx > 0 && (
                <div className={`h-1 flex-1 mx-2 ${step > idx ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === idx + 1 ? 'bg-primary text-white' :
                step > idx + 1 ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > idx + 1 ? '✓' : idx + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${step === idx + 1 ? 'text-primary font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-4">
          {step === 1 && (
            <TriggerStep
              pipelines={pipelines}
              value={state.trigger}
              onChange={(trigger) => setState(s => ({ ...s, trigger }))}
            />
          )}
          {step === 2 && (
            <ConditionsStep
              value={state.conditions}
              onChange={(conditions) => setState(s => ({ ...s, conditions }))}
            />
          )}
          {step === 3 && (
            <ActionStep
              pipelines={pipelines}
              value={state.action}
              onChange={(action) => setState(s => ({ ...s, action }))}
            />
          )}
          {step === 4 && (
            <ReviewStep
              state={state}
              pipelines={pipelines}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : (automation ? 'Salvar Alterações' : 'Criar Automação')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AutomationWizard;
