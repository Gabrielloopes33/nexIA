'use client'

import { DashboardCard } from '@/components/dashboard/dashboard-card'
import { useHealthScore } from '@/hooks/dashboard/use-health-score'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { HealthScoreGauge } from './gauge'
import { HealthScoreMetrics } from './metrics'
import { HealthScoreSkeleton } from './skeleton'
import { DashboardError } from '@/components/dashboard/dashboard-error'
import { Activity } from 'lucide-react'

/**
 * Card de Health Score
 * 
 * Exibe um gauge circular animado com o score de saúde
 * do funil de vendas e métricas detalhadas dos fatores.
 * 
 * Versão compacta: mostra apenas o gauge circular quando
 * usado ao lado da Receita Semanal (layout wireframe).
 * 
 * Features:
 * - Gauge circular animado com CSS transitions
 * - Score ponderado (0-100)
 * - Status colorido (SAUDÁVEL, OK, ATENÇÃO, CRÍTICO)
 * - 4 métricas de fatores (versão full)
 * - Loading state com skeleton
 * - Error state com retry
 */
export function HealthScoreCard({ compact = true }: { compact?: boolean }) {
  const { period } = useDashboardFilters()
  const { data, isLoading, error, refetch } = useHealthScore(period)

  // Estado de loading
  if (isLoading) {
    return (
      <DashboardCard 
        title={compact ? undefined : "Health Score"}
        icon={compact ? undefined : <Activity className="h-4 w-4" />}
        className={compact ? "h-full min-h-[200px]" : "h-[200px]"}
      >
        {compact ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse">
              <div className="h-20 w-20 rounded-full bg-slate-200" />
            </div>
          </div>
        ) : (
          <HealthScoreSkeleton />
        )}
      </DashboardCard>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <DashboardCard 
        title={compact ? undefined : "Health Score"}
        icon={compact ? undefined : <Activity className="h-4 w-4" />}
        className={compact ? "h-full min-h-[200px]" : "h-[200px]"}
      >
        <DashboardError onRetry={refetch} size={compact ? 'sm' : 'md'} />
      </DashboardCard>
    )
  }

  // Estado vazio
  if (!data) {
    return (
      <DashboardCard 
        title={compact ? undefined : "Health Score"}
        icon={compact ? undefined : <Activity className="h-4 w-4" />}
        className={compact ? "h-full min-h-[200px]" : "h-[200px]"}
      >
        <div className={`text-center text-muted-foreground ${compact ? 'py-4' : 'py-8'}`}>
          Nenhum dado
        </div>
      </DashboardCard>
    )
  }

  // Versão compacta (ao lado da Receita Semanal)
  if (compact) {
    return (
      <DashboardCard 
        title="Health Score"
        icon={<Activity className="h-4 w-4" />}
        className="h-full min-h-[200px] flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-start -mt-14 pt-2">
          <HealthScoreGauge score={data.score} status={data.status} size="md" />
          <p className="text-[10px] font-medium text-slate-400 text-center mt-1 uppercase">
            {data.status}
          </p>
        </div>
      </DashboardCard>
    )
  }

  // Versão full (card normal)
  return (
    <DashboardCard 
      title="Health Score" 
      subtitle={data.status}
      icon={<Activity className="h-4 w-4" />}
      className="h-[200px]"
    >
      <div className="flex items-center gap-4 h-full">
        <HealthScoreGauge score={data.score} status={data.status} />
        <HealthScoreMetrics factors={data.factors} />
      </div>
    </DashboardCard>
  )
}

export default HealthScoreCard
