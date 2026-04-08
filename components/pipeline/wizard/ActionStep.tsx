/**
 * Action Step - Wizard de Automação
 * 
 * @module components/pipeline/wizard/ActionStep
 * @description Step 3: Configuração da ação da automação
 */

'use client';

import { AutomationAction, Pipeline, AUTOMATION_ACTION_LABELS, AutomationActionType } from '@/types/pipeline-config';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, Copy, Plus, Zap } from 'lucide-react';

interface ActionStepProps {
  pipelines: Pipeline[];
  value: Partial<AutomationAction>;
  onChange: (value: Partial<AutomationAction>) => void;
}

const ACTION_TYPES: { value: AutomationActionType; label: string; description: string; icon: React.ElementType }[] = [
  { 
    value: 'move', 
    label: AUTOMATION_ACTION_LABELS.move, 
    description: 'Move o negócio para outro pipeline',
    icon: ArrowRightLeft
  },
  { 
    value: 'copy', 
    label: AUTOMATION_ACTION_LABELS.copy, 
    description: 'Cria uma cópia no outro pipeline',
    icon: Copy
  },
  { 
    value: 'create', 
    label: AUTOMATION_ACTION_LABELS.create, 
    description: 'Cria um novo negócio relacionado',
    icon: Plus
  },
];

/**
 * Step de configuração da ação
 */
export function ActionStep({ pipelines = [], value, onChange }: ActionStepProps) {
  const selectedPipeline = pipelines.find(p => p.id === value.targetPipelineId);
  const options = (value.options || {}) as Partial<AutomationAction['options']>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Zap className="w-4 h-4" />
        <span>Configure o que deve acontecer quando a automação for executada</span>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Ação</Label>
        <div className="grid grid-cols-1 gap-3">
          {ACTION_TYPES.map(action => {
            const Icon = action.icon;
            return (
              <div
                key={action.value}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-colors flex items-start gap-3",
                  value.type === action.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted'
                )}
                onClick={() => onChange({ ...value, type: action.value })}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  value.type === action.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-pipeline">Pipeline de Destino</Label>
        <Select
          value={value.targetPipelineId || ''}
          onValueChange={(targetPipelineId) =>
            onChange({ ...value, targetPipelineId, targetStageId: undefined })
          }
        >
          <SelectTrigger id="target-pipeline">
            <SelectValue placeholder="Selecione um pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map(pipeline => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: pipeline.color }} 
                  />
                  {pipeline.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPipeline && (
        <div className="space-y-2">
          <Label htmlFor="target-stage">Estágio de Destino</Label>
          <Select
            value={value.targetStageId || ''}
            onValueChange={(targetStageId) => onChange({ ...value, targetStageId })}
          >
            <SelectTrigger id="target-stage">
              <SelectValue placeholder="Selecione um estágio" />
            </SelectTrigger>
            <SelectContent>
              {selectedPipeline.stages?.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <Label>Opções</Label>
        <div className="space-y-3 bg-muted p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={options?.keepAssignee ?? true}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  options: { ...options, keepAssignee: checked as boolean }
                })
              }
            />
            <span className="text-sm">Manter responsável original</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={options?.copyTags ?? true}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  options: { ...options, copyTags: checked as boolean }
                })
              }
            />
            <span className="text-sm">Copiar tags</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={options?.copyValue ?? true}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  options: { ...options, copyValue: checked as boolean }
                })
              }
            />
            <span className="text-sm">Copiar valor do negócio</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={options?.copyDescription ?? true}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  options: { ...options, copyDescription: checked as boolean }
                })
              }
            />
            <span className="text-sm">Copiar descrição</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={options?.copyHistory ?? false}
              onCheckedChange={(checked) =>
                onChange({
                  ...value,
                  options: { ...options, copyHistory: checked as boolean }
                })
              }
            />
            <span className="text-sm">Copiar histórico de mensagens</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default ActionStep;
