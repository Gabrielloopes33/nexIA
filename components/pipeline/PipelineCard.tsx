/**
 * Card de Pipeline
 * 
 * @module components/pipeline/PipelineCard
 * @description Card individual exibindo informações e ações de um pipeline
 */

'use client'

import { useState } from 'react'
import { 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Star, 
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle
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
import { Pipeline } from '@/types/pipeline-config'

interface PipelineCardProps {
  /** Pipeline a ser exibido */
  pipeline: Pipeline
  
  /** Callback ao toggle ativar/desativar */
  onToggle: (pipeline: Pipeline, isActive: boolean) => void
  
  /** Callback ao definir como padrão */
  onSetDefault: (pipeline: Pipeline) => void
  
  /** Callback ao editar */
  onEdit: (pipeline: Pipeline) => void
  
  /** Callback ao excluir */
  onDelete: (pipeline: Pipeline) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Card individual de pipeline
 */
export function PipelineCard({
  pipeline,
  onToggle,
  onSetDefault,
  onEdit,
  onDelete,
  isLoading = false,
}: PipelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const dealCount = pipeline._count?.deals ?? 0
  const automationCount = pipeline._count?.automations ?? 0
  const stageCount = pipeline.stages?.length ?? 0
  
  // Verifica se pode excluir (sem negócios associados)
  const canDelete = dealCount === 0
  
  // Verifica se pode desativar (não é o único ativo)
  const isOnlyActive = pipeline.isActive && dealCount > 0
  
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 transition-all',
        pipeline.isActive 
          ? 'opacity-100' 
          : 'opacity-60 bg-muted/30',
        isLoading && 'pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Ícone e Nome */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: pipeline.color }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {pipeline.name}
              </h3>
              {pipeline.isDefault && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex-shrink-0">
                  <Star className="h-3 w-3 mr-0.5" />
                  Padrão
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PIPELINE_TYPE_LABELS[pipeline.type]}
            </p>
          </div>
        </div>
        
        {/* Toggle e Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`pipeline-toggle-${pipeline.id}`}
                    checked={pipeline.isActive}
                    onCheckedChange={(checked) => onToggle(pipeline, checked)}
                    disabled={isLoading}
                    aria-label={`${pipeline.isActive ? 'Desativar' : 'Ativar'} pipeline ${pipeline.name}`}
                  />
                  <Label 
                    htmlFor={`pipeline-toggle-${pipeline.id}`}
                    className="sr-only"
                  >
                    {pipeline.isActive ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              </TooltipTrigger>
              {isOnlyActive && (
                <TooltipContent>
                  <p>Este pipeline possui negócios ativos</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(pipeline)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              {!pipeline.isDefault && pipeline.isActive && (
                <DropdownMenuItem onClick={() => onSetDefault(pipeline)}>
                  <Star className="h-4 w-4 mr-2" />
                  Definir como padrão
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => onDelete(pipeline)}
                disabled={!canDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
                {!canDelete && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {dealCount} negócios
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {stageCount} etapa{stageCount !== 1 ? 's' : ''}
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          {dealCount} negócio{dealCount !== 1 ? 's' : ''}
        </span>
        {automationCount > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-600">
              <Zap className="h-3 w-3" />
              {automationCount} automação{automationCount !== 1 ? 's' : ''}
            </span>
          </>
        )}
        
        {/* Expand/Collapse */}
        {pipeline.stages && pipeline.stages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Menos
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Etapas
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Expanded: Stages List */}
      {isExpanded && pipeline.stages && pipeline.stages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Etapas:
          </p>
          <div className="space-y-1.5">
            {pipeline.stages
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-xs text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="truncate">{stage.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {stage.probability}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Alerta se não pode excluir */}
      {!canDelete && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Não é possível excluir: possui {dealCount} negócio{dealCount !== 1 ? 's' : ''} associado{dealCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

// Labels dos tipos
const PIPELINE_TYPE_LABELS: Record<string, string> = {
  vendas: 'Vendas',
  follow_up: 'Follow Up',
  pos_venda: 'Pós-venda',
  outro: 'Outro',
}

export default PipelineCard
