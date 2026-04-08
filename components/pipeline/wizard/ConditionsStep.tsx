/**
 * Conditions Step - Wizard de Automação
 * 
 * @module components/pipeline/wizard/ConditionsStep
 * @description Step 2: Configuração de condições opcionais da automação
 */

'use client';

import { useState, useEffect } from 'react';
import { AutomationCondition, AutomationConditionField, AutomationOperator, AUTOMATION_FIELD_LABELS, AUTOMATION_OPERATOR_LABELS } from '@/types/pipeline-config';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, Filter } from 'lucide-react';

interface ConditionsStepProps {
  value: AutomationCondition[];
  onChange: (value: AutomationCondition[]) => void;
}

const FIELDS: { value: AutomationConditionField; label: string; type: 'text' | 'number' | 'select' }[] = [
  { value: 'value', label: 'Valor do negócio', type: 'number' },
  { value: 'priority', label: 'Prioridade', type: 'select' },
  { value: 'tags', label: 'Tags', type: 'text' },
  { value: 'source', label: 'Origem', type: 'text' },
  { value: 'assignee', label: 'Responsável', type: 'text' },
  { value: 'days_in_stage', label: 'Dias na etapa', type: 'number' },
];

const OPERATORS: { value: AutomationOperator; label: string }[] = [
  { value: 'equals', label: AUTOMATION_OPERATOR_LABELS.equals },
  { value: 'not_equals', label: AUTOMATION_OPERATOR_LABELS.not_equals },
  { value: 'greater_than', label: AUTOMATION_OPERATOR_LABELS.greater_than },
  { value: 'less_than', label: AUTOMATION_OPERATOR_LABELS.less_than },
  { value: 'contains', label: AUTOMATION_OPERATOR_LABELS.contains },
  { value: 'not_contains', label: AUTOMATION_OPERATOR_LABELS.not_contains },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

/**
 * Step de configuração de condições
 */
export function ConditionsStep({ value, onChange }: ConditionsStepProps) {
  const [conditions, setConditions] = useState<AutomationCondition[]>(value || []);

  useEffect(() => {
    setConditions(value || []);
  }, [value]);

  const addCondition = () => {
    const newCondition: AutomationCondition = {
      field: 'value',
      operator: 'greater_than',
      value: ''
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    onChange(updated);
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    const updated = conditions.map((c, i) => i === index ? { ...c, ...updates } : c);
    setConditions(updated);
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onChange(updated);
  };

  const getFieldType = (field: AutomationConditionField) => {
    return FIELDS.find(f => f.value === field)?.type || 'text';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Filter className="w-4 h-4" />
        <span>Adicione condições opcionais para filtrar quando a automação deve executar</span>
      </div>

      <p className="text-sm text-muted-foreground">
        A automação só será executada se TODAS as condições forem atendidas.
      </p>

      {conditions.length === 0 && (
        <div className="text-center py-8 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Nenhuma condição definida. A automação será executada para todos os negócios.
          </p>
          <Button variant="outline" onClick={addCondition} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Condição
          </Button>
        </div>
      )}

      {conditions.map((condition, index) => {
        const fieldType = getFieldType(condition.field);
        
        return (
          <div key={index} className="flex items-start gap-2 p-4 bg-muted rounded-lg">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Select
                value={condition.field}
                onValueChange={(field) => updateCondition(index, { field: field as AutomationConditionField })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.operator}
                onValueChange={(operator) => updateCondition(index, { operator: operator as AutomationOperator })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {fieldType === 'select' && condition.field === 'priority' ? (
                <Select
                  value={String(condition.value)}
                  onValueChange={(val) => updateCondition(index, { value: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={fieldType === 'number' ? 'number' : 'text'}
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Valor"
                />
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeCondition(index)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      })}

      {conditions.length > 0 && (
        <Button variant="outline" onClick={addCondition} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Outra Condição
        </Button>
      )}
    </div>
  );
}

export default ConditionsStep;
