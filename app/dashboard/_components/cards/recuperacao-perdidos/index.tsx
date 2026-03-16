'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useLostDeals } from '@/hooks/dashboard/use-lost-deals'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { RecuperacaoPerdidosList } from './list'
import { RecuperacaoPerdidosSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { RotateCcw } from 'lucide-react'

/**
 * Card de Recuperação de Perdidos
 * 
 * Exibe uma lista de leads perdidos com potencial de recuperação,
 * ordenados por score de recuperação.
 * 
 * Features:
 * - Loading state com skeleton
 * - Error state com retry
 * - Empty state quando não há leads perdidos
 * - Badge colorido baseado no score de recuperação
 * - Atualização automática ao mudar o período
 */
export function RecuperacaoPerdidosCard() {
  const { period } = useDashboardFilters()
  const { data, isLoading, error, refetch } = useLostDeals(period, 5)

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Recuperação" 
        icon={<RotateCcw className="h-4 w-4" />}
        className="h-[320px]"
      >
        <RecuperacaoPerdidosSkeleton />
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Recuperação" 
        icon={<RotateCcw className="h-4 w-4" />}
        className="h-[320px]"
      >
        <DashboardError onRetry={refetch} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data?.deals.length) {
    return (
      <DashboardCard 
        title="Recuperação" 
        icon={<RotateCcw className="h-4 w-4" />}
        className="h-[320px]"
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum lead perdido no período
        </div>
      </DashboardCard>
    )
  }

  // Estado normal
  return (
    <DashboardCard 
      title="Recuperação" 
      description="Leads perdidos com potencial"
      icon={<RotateCcw className="h-4 w-4" />}
      className="h-[320px]"
    >
      <RecuperacaoPerdidosList deals={data.deals} />
    </DashboardCard>
  )
}

export default RecuperacaoPerdidosCard
