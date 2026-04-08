/**
 * Botão de Configuração de Pipelines e Automações
 * 
 * @module components/pipeline/PipelineConfigButton
 * @description Botão discreto no header do pipeline com indicador de automações
 */

'use client'

import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PipelineConfigButtonProps {
  /** Número de automações configuradas */
  automationCount: number
  
  /** Callback ao clicar no botão */
  onClick: () => void
  
  /** Classe CSS adicional */
  className?: string
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Botão de configuração que aparece no header do pipeline
 * 
 * @example
 * ```tsx
 * <PipelineConfigButton
 *   automationCount={3}
 *   onClick={() => setDrawerOpen(true)}
 * />
 * ```
 */
export function PipelineConfigButton({
  automationCount,
  onClick,
  className,
  isLoading = false,
}: PipelineConfigButtonProps) {
  const hasAutomations = automationCount > 0
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'relative h-9 px-3 transition-colors',
        className
      )}
      aria-label="Configurar pipelines e automações"
      aria-haspopup="dialog"
      aria-expanded={false} // Controlado pelo componente pai
    >
      <Settings2 className="h-4 w-4" aria-hidden="true" />
      
      {/* Texto visível apenas em telas maiores */}
      <span className="ml-2 hidden sm:inline text-sm">
        Configurar
      </span>
      
      {/* Badge de notificação */}
      {hasAutomations && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-semibold flex items-center justify-center"
          role="status"
          aria-label={`${automationCount} automações configuradas`}
        >
          {automationCount > 9 ? '9+' : automationCount}
        </Badge>
      )}
      
      {/* Texto para leitores de tela */}
      <span className="sr-only">
        {hasAutomations 
          ? `Abrir configurações. ${automationCount} automações configuradas.` 
          : 'Abrir configurações de pipelines'}
      </span>
    </Button>
  )
}

export default PipelineConfigButton
