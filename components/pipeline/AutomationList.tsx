/**
 * Lista de Automações
 * 
 * @module components/pipeline/AutomationList
 * @description Lista de automações com estado vazio e ações
 */

'use client'

import { Plus, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AutomationCard } from './AutomationCard'
import { Automation, Pipeline } from '@/types/pipeline-config'

interface AutomationListProps {
  /** Automações a serem exibidas */
  automations: Automation[]
  
  /** Pipelines para referência */
  pipelines: Pipeline[]
  
  /** Callbacks */
  onCreate: () => void
  onEdit: (automation: Automation) => void
  onDelete: (automation: Automation) => void
  onToggle: (automation: Automation, isActive: boolean) => void
  onDuplicate?: (automation: Automation) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Lista de automações com estado vazio
 */
export function AutomationList({
  automations = [],
  pipelines = [],
  onCreate,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  isLoading = false,
}: AutomationListProps) {
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="ml-3 text-sm text-muted-foreground">
          Carregando automações...
        </span>
      </div>
    )
  }
  
  // Estado vazio
  if (automations.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Workflow className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma automação configurada</EmptyTitle>
          <EmptyDescription>
            Automatize o fluxo de negócios entre pipelines.
            Crie sua primeira automação para começar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeira Automação
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  
  // Contagens
  const activeCount = automations.filter(a => a.isActive).length
  const pausedCount = automations.length - activeCount
  const errorCount = automations.filter(a => !!a.lastError).length
  
  // Lista de automações
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            Automações Configuradas
          </h2>
          <p className="text-xs text-muted-foreground">
            {automations.length} automação{automations.length !== 1 ? 's' : ''} · {' '}
            {activeCount} ativa{activeCount !== 1 ? 's' : ''}
            {pausedCount > 0 && ` · ${pausedCount} pausada${pausedCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={onCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Automação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>
      
      {/* Alerta de erros */}
      {errorCount > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">
            {errorCount} automação{errorCount !== 1 ? 's' : ''} com erro. 
            Verifique as configurações.
          </AlertDescription>
        </Alert>
      )}
      
      {/* List */}
      <div className="space-y-3">
        {automations
          .sort((a, b) => {
            // Com erros primeiro, depois ativas, depois por data
            if (!!a.lastError !== !!b.lastError) return a.lastError ? -1 : 1
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })
          .map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              pipelines={pipelines}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
      </div>
    </div>
  )
}

export default AutomationList
