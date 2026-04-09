'use client'

import { useState, useEffect } from 'react'
import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useFunnel } from '@/hooks/dashboard/use-funnel'
import { useDashboardPipelines } from '@/hooks/dashboard/use-pipelines'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { FunilPorEtapaChart } from './chart'
import { FunilPorEtapaSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { Funnel } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Card de Funil por Etapa
 * 
 * Exibe um gráfico de barras horizontais mostrando a distribuição
 * de leads por etapa do funil de vendas.
 * 
 * Features:
 * - Loading state com skeleton
 * - Error state com retry
 * - Empty state quando não há dados
 * - Atualização automática ao mudar o período
 * - Seleção de pipeline (padrão ou específico)
 */
export function FunilPorEtapaCard() {
  const { period } = useDashboardFilters()
  const { pipelines, defaultPipelineId, isLoading: isLoadingPipelines } = useDashboardPipelines()
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  
  // Define o pipeline padrão quando os dados carregam
  useEffect(() => {
    if (defaultPipelineId && !selectedPipelineId) {
      setSelectedPipelineId(defaultPipelineId)
    }
  }, [defaultPipelineId, selectedPipelineId])
  
  const { data, isLoading, error, refetch } = useFunnel(period, selectedPipelineId)

  // Estado de loading inicial (pipelines)
  if (isLoadingPipelines) {
    return (
      <DashboardCard 
        title="Funil por Etapa" 
        icon={<Funnel className="h-4 w-4" />}
        className="h-[320px]"
      >
        <FunilPorEtapaSkeleton />
      </DashboardCard>
    )
  }

  // Header com seletor de pipeline
  const headerActions = pipelines.length > 1 ? (
    <Select
      value={selectedPipelineId || 'default'}
      onValueChange={(value) => setSelectedPipelineId(value === 'default' ? null : value)}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Selecionar pipeline" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default" className="text-xs">
          Padrão
        </SelectItem>
        {pipelines.map((pipeline) => (
          <SelectItem 
            key={pipeline.id} 
            value={pipeline.id}
            className="text-xs"
          >
            {pipeline.name}
            {pipeline.isDefault && (
              <span className="ml-1 text-[10px] text-muted-foreground">(padrão)</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Funil por Etapa" 
        icon={<Funnel className="h-4 w-4" />}
        className="h-[320px]"
        action={headerActions}
      >
        <FunilPorEtapaSkeleton />
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Funil por Etapa" 
        icon={<Funnel className="h-4 w-4" />}
        className="h-[320px]"
        action={headerActions}
      >
        <DashboardError onRetry={refetch} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data || data.stages.length === 0) {
    return (
      <DashboardCard 
        title="Funil por Etapa" 
        icon={<Funnel className="h-4 w-4" />}
        className="h-[320px]"
        action={headerActions}
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado disponível
          {selectedPipelineId && (
            <p className="text-xs mt-1">
              Pipeline selecionado não possui etapas configuradas
            </p>
          )}
        </div>
      </DashboardCard>
    )
  }

  // Estado normal
  return (
    <DashboardCard 
      title="Funil por Etapa" 
      icon={<Funnel className="h-4 w-4" />}
      className="h-[320px]"
      action={headerActions}
    >
      <FunilPorEtapaChart data={data} />
    </DashboardCard>
  )
}

export default FunilPorEtapaCard
