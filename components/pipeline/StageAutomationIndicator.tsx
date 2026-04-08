/**
 * Indicador de Automação no Estágio do Pipeline
 * 
 * @module components/pipeline/StageAutomationIndicator
 * @description Badge e tooltip mostrando automações configuradas para um estágio
 */

'use client'

import { Zap, ArrowRight, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Automation, Pipeline, AUTOMATION_ACTION_LABELS } from '@/types/pipeline-config'

interface StageAutomationIndicatorProps {
  /** Automações configuradas para este estágio */
  automations?: Automation[]
  
  /** Pipelines para referência de nomes */
  pipelines?: Pipeline[]
  
  /** Callback ao clicar em gerenciar */
  onManage?: () => void
  
  /** Contagem simplificada (quando não tem acesso às automações completas) */
  count?: number
  
  /** Classe CSS adicional */
  className?: string
}

/**
 * Indicador discreto de automações no header da coluna do pipeline
 * 
 * @example
 * ```tsx
 * <StageAutomationIndicator
 *   automations={stageAutomations}
 *   pipelines={allPipelines}
 *   onManage={() => openConfigDrawer()}
 * />
 * ```
 */
export function StageAutomationIndicator({
  automations = [],
  pipelines = [],
  onManage,
  count,
  className,
}: StageAutomationIndicatorProps) {
  // Usar count se fornecido, senão calcular do array
  const automationCount = count ?? automations?.length ?? 0
  
  // Se não há automações, não renderiza nada
  if (automationCount === 0) return null
  
  // Modo simplificado (apenas count)
  if (count !== undefined || !automations || automations.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
          'text-amber-700 bg-amber-50',
          className
        )}
      >
        <Zap className="h-3 w-3 fill-amber-500" />
        {automationCount}
      </span>
    )
  }
  
  const activeAutomations = automations.filter(a => a.isActive)
  const hasInactive = automations.some(a => !a.isActive)
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <button
            onClick={onManage}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors',
              'hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300',
              activeAutomations.length > 0 
                ? 'text-amber-700 bg-amber-50' 
                : 'text-muted-foreground bg-muted',
              className
            )}
            aria-label={`${automations.length} automações configuradas. Clique para gerenciar.`}
          >
            <Zap className={cn(
              'h-3 w-3',
              activeAutomations.length > 0 && 'fill-amber-500'
            )} />
            <span>{automations.length}</span>
            {hasInactive && (
              <span className="sr-only">(algumas pausadas)</span>
            )}
          </button>
        </TooltipTrigger>
        
        <TooltipContent 
          side="bottom" 
          align="center"
          className="max-w-xs p-0"
        >
          <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">
                Automações configuradas:
              </p>
              {hasInactive && (
                <span className="text-[10px] text-muted-foreground">
                  {activeAutomations.length}/{automations.length} ativas
                </span>
              )}
            </div>
            
            {/* Lista */}
            <div className="space-y-2">
              {automations.slice(0, 3).map((automation) => {
                const targetPipeline = pipelines.find(
                  p => p.id === automation.action.targetPipelineId
                )
                const targetStage = targetPipeline?.stages?.find(
                  s => s.id === automation.action.targetStageId
                )
                
                return (
                  <div 
                    key={automation.id}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      !automation.isActive && 'opacity-50'
                    )}
                  >
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      automation.isActive ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                    <span className="flex-1 truncate">
                      {AUTOMATION_ACTION_LABELS[automation.action.type]}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[100px]">
                      {targetPipeline?.name || 'Desconhecido'}
                    </span>
                  </div>
                )
              })}
              
              {automations.length > 3 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  +{automations.length - 3} mais
                </p>
              )}
            </div>
            
            {/* Botão */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-7 text-xs gap-1.5"
              onClick={onManage}
            >
              <Settings2 className="h-3 w-3" />
              Gerenciar automações
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Versão simplificada do indicador (apenas ícone para espaços pequenos)
 */
export function StageAutomationIcon({
  count,
  onManage,
  className,
}: {
  count: number
  onManage: () => void
  className?: string
}) {
  if (count === 0) return null
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onManage}
            className={cn(
              'p-1 rounded transition-colors',
              'hover:bg-amber-100 text-amber-600',
              className
            )}
            aria-label={`${count} automações configuradas`}
          >
            <Zap className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{count} automação{count !== 1 ? 's' : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default StageAutomationIndicator
