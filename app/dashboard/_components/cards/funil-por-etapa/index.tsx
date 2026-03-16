'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useFunnel } from '@/hooks/dashboard/use-funnel'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { FunilPorEtapaChart } from './chart'
import { FunilPorEtapaSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { Funnel } from 'lucide-react'

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
 */
export function FunilPorEtapaCard() {
  const { period } = useDashboardFilters()
  const { data, isLoading, error, refetch } = useFunnel(period)

  // Estado de loading
  if (isLoading) {
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

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Funil por Etapa" 
        icon={<Funnel className="h-4 w-4" />}
        className="h-[320px]"
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
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado disponível
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
    >
      <FunilPorEtapaChart data={data} />
    </DashboardCard>
  )
}

export default FunilPorEtapaCard
