/**
 * Card de Automação
 * 
 * @module components/pipeline/AutomationCard
 * @description Card individual exibindo informações e ações de uma automação
 */

'use client'

import { 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Copy,
  Zap,
  ArrowRight,
  GitCommit,
  Target,
  Pause,
  Play,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Automation, Pipeline, AUTOMATION_ACTION_LABELS } from '@/types/pipeline-config'

interface AutomationCardProps {
  /** Automação a ser exibida */
  automation: Automation
  
  /** Pipelines para referência de nomes */
  pipelines: Pipeline[]
  
  /** Callbacks */
  onToggle: (automation: Automation, isActive: boolean) => void
  onEdit: (automation: Automation) => void
  onDelete: (automation: Automation) => void
  onDuplicate?: (automation: Automation) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Card individual de automação
 */
export function AutomationCard({
  automation,
  pipelines = [],
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  isLoading = false,
}: AutomationCardProps) {
  // Encontra os pipelines e estágios referenciados
  const triggerPipeline = pipelines.find(p => p.id === automation.trigger.pipelineId)
  const targetPipeline = pipelines.find(p => p.id === automation.action.targetPipelineId)
  
  const triggerStage = triggerPipeline?.stages?.find(
    s => s.id === automation.trigger.stageId
  )
  const targetStage = targetPipeline?.stages?.find(
    s => s.id === automation.action.targetStageId
  )
  
  // Condições ativas
  const hasConditions = automation.conditions && automation.conditions.length > 0
  const conditionsCount = automation.conditions?.length ?? 0
  
  // Estado da automação
  const isPaused = !automation.isActive
  const hasError = !!automation.lastError
  
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-all',
        isPaused && 'opacity-70 bg-muted/20',
        hasError && 'border-red-200 bg-red-50/30',
        isLoading && 'pointer-events-none'
      )}
    >
      {/* Header: Fluxo Origem → Destino */}
      <div className="flex items-center gap-2 mb-3">
        {/* Origem */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: triggerPipeline?.color || '#6b7280' }}
          />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {triggerPipeline?.name || 'Pipeline removido'}
            </p>
            <p className="text-sm font-medium truncate">
              {triggerStage?.name || 'Etapa removida'}
            </p>
          </div>
        </div>
        
        {/* Seta */}
        <ArrowRight className="h-4 w-4 text-purple-500 flex-shrink-0" />
        
        {/* Destino */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground truncate">
              {targetPipeline?.name || 'Pipeline removido'}
            </p>
            <p className="text-sm font-medium truncate">
              {targetStage?.name || 'Etapa removida'}
            </p>
          </div>
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: targetPipeline?.color || '#6b7280' }}
          />
        </div>
      </div>
      
      {/* Ação e Condições */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge 
          variant="outline" 
          className={cn(
            'gap-1.5',
            automation.action.type === 'move' && 'border-blue-200 text-blue-700',
            automation.action.type === 'copy' && 'border-purple-200 text-purple-700',
            automation.action.type === 'create' && 'border-green-200 text-green-700',
          )}
        >
          <Zap className="h-3 w-3" />
          {AUTOMATION_ACTION_LABELS[automation.action.type]}
        </Badge>
        
        {hasConditions && (
          <Badge variant="secondary" className="text-xs">
            {conditionsCount} condição{conditionsCount !== 1 ? 's' : ''}
          </Badge>
        )}
        
        {automation.executionCount > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {automation.executionCount} execução{automation.executionCount !== 1 ? 's' : ''}
          </Badge>
        )}
        
        {hasError && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="destructive" 
                  className="text-xs gap-1 cursor-help"
                >
                  <AlertCircle className="h-3 w-3" />
                  Erro
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{automation.lastError}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Opções da Ação */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
        {automation.action.options.keepAssignee && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Mantém responsável
          </span>
        )}
        {automation.action.options.copyTags && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Copia tags
          </span>
        )}
      </div>
      
      {/* Footer: Toggle e Ações */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Switch
            id={`automation-toggle-${automation.id}`}
            checked={automation.isActive}
            onCheckedChange={(checked) => onToggle(automation, checked)}
            disabled={isLoading || hasError}
            aria-label={`${automation.isActive ? 'Desativar' : 'Ativar'} automação`}
          />
          <Label 
            htmlFor={`automation-toggle-${automation.id}`}
            className={cn(
              'text-xs cursor-pointer',
              isPaused && 'text-muted-foreground'
            )}
          >
            {isPaused ? (
              <span className="flex items-center gap-1">
                <Pause className="h-3 w-3" />
                Pausada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-600">
                <Play className="h-3 w-3" />
                Ativa
              </span>
            )}
          </Label>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(automation)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(automation)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => onDelete(automation)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default AutomationCard
