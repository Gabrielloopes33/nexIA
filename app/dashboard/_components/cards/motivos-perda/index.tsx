'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useLostReasons } from '@/hooks/dashboard/use-lost-reasons'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { MotivosPerdaChart } from './chart'
import { MotivosPerdaSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { PieChart } from 'lucide-react'

/**
 * Card de Motivos de Perda
 * 
 * Exibe um gráfico de pizza mostrando a distribuição
 * dos motivos pelos quais leads foram perdidos.
 * 
 * Features:
 * - Loading state com skeleton
 * - Error state com retry
 * - Empty state quando não há dados
 * - Tooltip detalhado com trends
 * - Atualização automática ao mudar o período
 */
export function MotivosPerdaCard() {
  const { period } = useDashboardFilters()
  const { data, isLoading, error, refetch } = useLostReasons(period)

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Motivos de Perda" 
        icon={<PieChart className="h-4 w-4" />}
        className="h-[280px]"
      >
        <MotivosPerdaSkeleton />
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Motivos de Perda" 
        icon={<PieChart className="h-4 w-4" />}
        className="h-[280px]"
      >
        <DashboardError onRetry={refetch} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data?.reasons.length) {
    return (
      <DashboardCard 
        title="Motivos de Perda" 
        icon={<PieChart className="h-4 w-4" />}
        className="h-[280px]"
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado de perdas no período
        </div>
      </DashboardCard>
    )
  }

  // Estado normal
  return (
    <DashboardCard 
      title="Motivos de Perda" 
      icon={<PieChart className="h-4 w-4" />}
      className="h-[280px]"
    >
      <MotivosPerdaChart data={data.reasons} />
    </DashboardCard>
  )
}

export default MotivosPerdaCard
