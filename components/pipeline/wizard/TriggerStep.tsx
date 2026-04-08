/**
 * Trigger Step - Wizard de Automação
 * 
 * @module components/pipeline/wizard/TriggerStep
 * @description Step 1: Configuração do gatilho da automação
 */

'use client';

import { AutomationTrigger, Pipeline } from '@/types/pipeline-config';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCommit } from 'lucide-react';

interface TriggerStepProps {
  pipelines: Pipeline[];
  value: Partial<AutomationTrigger>;
  onChange: (value: Partial<AutomationTrigger>) => void;
}

/**
 * Step de configuração do gatilho
 */
export function TriggerStep({ pipelines = [], value, onChange }: TriggerStepProps) {
  const selectedPipeline = pipelines.find(p => p.id === value.pipelineId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <GitCommit className="w-4 h-4" />
        <span>Configure quando a automação deve ser executada</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pipeline-select">Pipeline de Origem</Label>
        <Select
          value={value.pipelineId || ''}
          onValueChange={(pipelineId) => onChange({ ...value, pipelineId, stageId: undefined })}
        >
          <SelectTrigger id="pipeline-select">
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
          <Label htmlFor="stage-select">Quando o negócio entrar no estágio</Label>
          <Select
            value={value.stageId || ''}
            onValueChange={(stageId) => onChange({ ...value, stageId })}
          >
            <SelectTrigger id="stage-select">
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

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Esta automação será executada sempre que um negócio entrar no estágio selecionado.
        </p>
      </div>
    </div>
  );
}

export default TriggerStep;
