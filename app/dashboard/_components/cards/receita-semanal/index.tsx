'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useRevenue } from '@/hooks/dashboard/use-revenue'
import { ReceitaSemanalChart } from './chart'
import { ReceitaSemanalSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { TrendingUp } from 'lucide-react'

/**
 * Card de Receita Semanal
 * 
 * Exibe um gráfico de linha mostrando a evolução da receita
 * ao longo das últimas 8 semanas, comparando com a meta.
 * 
 * Features:
 * - Loading state com skeleton
 * - Error state com retry
 * - Empty state quando não há dados
 * - Linha de meta tracejada
 * - Linha de média de referência
 * - Tooltip detalhado
 */
export function ReceitaSemanalCard() {
  const { data, isLoading, error, refetch } = useRevenue(8)

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Receita Semanal" 
        icon={<TrendingUp className="h-4 w-4" />}
        className="h-[200px]"
      >
        <ReceitaSemanalSkeleton />
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title="Receita Semanal" 
        icon={<TrendingUp className="h-4 w-4" />}
        className="h-[200px]"
      >
        <DashboardError onRetry={refetch} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data?.weeks.length) {
    return (
      <DashboardCard 
        title="Receita Semanal" 
        icon={<TrendingUp className="h-4 w-4" />}
        className="h-[200px]"
      >
        <div className="text-center text-muted-foreground py-8">
          Nenhum dado de receita
        </div>
      </DashboardCard>
    )
  }

  // Estado normal
  return (
    <DashboardCard 
      title="Receita Semanal" 
      icon={<TrendingUp className="h-4 w-4" />}
      className="h-[200px]"
    >
      <ReceitaSemanalChart data={data.weeks} />
    </DashboardCard>
  )
}

export default ReceitaSemanalCard
