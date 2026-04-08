/**
 * Lista de Pipelines
 * 
 * @module components/pipeline/PipelineList
 * @description Lista de pipelines com estado vazio e ações
 */

'use client'

import { Plus, FolderGit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { PipelineCard } from './PipelineCard'
import { Pipeline } from '@/types/pipeline-config'

interface PipelineListProps {
  /** Pipelines a serem exibidos */
  pipelines: Pipeline[]
  
  /** Callbacks */
  onCreate: () => void
  onEdit: (pipeline: Pipeline) => void
  onDelete: (pipeline: Pipeline) => void
  onToggle: (pipeline: Pipeline, isActive: boolean) => void
  onSetDefault: (pipeline: Pipeline) => void
  
  /** Se está carregando */
  isLoading?: boolean
}

/**
 * Lista de pipelines com estado vazio
 */
export function PipelineList({
  pipelines = [],
  onCreate,
  onEdit,
  onDelete,
  onToggle,
  onSetDefault,
  isLoading = false,
}: PipelineListProps) {
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="ml-3 text-sm text-muted-foreground">
          Carregando pipelines...
        </span>
      </div>
    )
  }
  
  // Estado vazio
  if (pipelines.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderGit2 className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum pipeline configurado</EmptyTitle>
          <EmptyDescription>
            Crie pipelines para organizar seus negócios.
            Comece com um pipeline de vendas principal.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Pipeline
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  
  // Lista de pipelines
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            Pipelines do Produto
          </h2>
          <p className="text-xs text-muted-foreground">
            {pipelines.length} pipeline{pipelines.length !== 1 ? 's' : ''} · {' '}
            {pipelines.filter(p => p.isActive).length} ativo{pipelines.filter(p => p.isActive).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Pipeline</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
      
      {/* List */}
      <div className="space-y-3">
        {pipelines
          .sort((a, b) => {
            // Padrão primeiro, depois ativos, depois por nome
            if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
            return a.name.localeCompare(b.name)
          })
          .map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onToggle={onToggle}
              onSetDefault={onSetDefault}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
      </div>
    </div>
  )
}

export default PipelineList
