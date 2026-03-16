'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useChannels } from '@/hooks/dashboard/use-channels'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { PerformanceCanalChart } from './chart'
import { PerformanceCanalSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { Share2 } from 'lucide-react'

/**
 * Card de Performance por Canal
 * 
 * Exibe um gráfico de barras comparando leads e deals
 * gerados por cada canal de comunicação.
 * 
 * Features:
 * - Loading state com skeleton
 * - Error state com retry
 * - Empty state quando não há dados
 * - Atualização automática ao mudar o período
 */
export function PerformanceCanalCard() {
  const { period } = useDashboardFilters()
  const { data, isLoading, error, refetch } = useChannels(period)

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Canais" 
        icon={<Share2 className="h-4 w-4" />}
        className="h-[280px]"
      >
        <PerformanceCanalSkeleton />
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Canais" 
        icon={<Share2 className="h-4 w-4" />}
        className="h-[280px]"
      >
        <DashboardError onRetry={refetch} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data?.channels.length) {
    return (
      <DashboardCard 
        title="Canais" 
        icon={<Share2 className="h-4 w-4" />}
        className="h-[280px]"
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado de canais no período
        </div>
      </DashboardCard>
    )
  }

  // Estado normal
  return (
    <DashboardCard 
      title="Performance por Canal" 
      icon={<Share2 className="h-4 w-4" />}
      className="h-[280px]"
    >
      <PerformanceCanalChart channels={data.channels} />
    </DashboardCard>
  )
}

export default PerformanceCanalCard
