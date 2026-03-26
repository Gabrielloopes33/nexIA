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
  const icon = <TrendingUp className="h-4 w-4" />

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title="Receita Semanal" 
        action={icon}
        className="h-50"
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
        action={icon}
        className="h-50"
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
        action={icon}
        className="h-50"
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
      action={icon}
      className="h-50"
    >
      <ReceitaSemanalChart data={data.weeks} />
    </DashboardCard>
  )
}

export default ReceitaSemanalCard
