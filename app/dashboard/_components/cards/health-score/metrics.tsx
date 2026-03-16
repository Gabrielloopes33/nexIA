import { HealthScoreFactors, HealthScoreStatus } from '@/hooks/dashboard/use-health-score'
import { TrendingUp, Clock, AlertTriangle, MessageCircle } from 'lucide-react'

interface HealthScoreMetricsProps {
  factors: HealthScoreFactors
}

/**
 * Métricas do Health Score
 * 
 * Exibe 4 cards com os fatores que compõem o score:
 * - Conversão vs Meta
 * - Velocidade do Funil
 * - Leads Estagnados
 * - Taxa de Follow-up
 */
export function HealthScoreMetrics({ factors }: HealthScoreMetricsProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACIMA':
      case 'OK':
        return 'text-emerald-600 bg-emerald-50'
      case 'NA_META':
        return 'text-blue-600 bg-blue-50'
      case 'ATENÇÃO':
      case 'LENTO':
        return 'text-amber-600 bg-amber-50'
      case 'ABAIXO':
      case 'CRÍTICO':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  const getConversionLabel = (status: HealthScoreFactors['conversionVsGoal']['status']): string => {
    switch (status) {
      case 'ACIMA':
        return 'Acima'
      case 'NA_META':
        return 'Na Meta'
      case 'ABAIXO':
        return 'Abaixo'
      default:
        return status
    }
  }

  const metrics = [
    {
      icon: TrendingUp,
      label: 'Conversão vs Meta',
      value: getConversionLabel(factors.conversionVsGoal.status),
      className: getStatusColor(factors.conversionVsGoal.status),
    },
    {
      icon: Clock,
      label: 'Velocidade Funil',
      value: factors.funnelVelocity.status,
      className: getStatusColor(factors.funnelVelocity.status),
    },
    {
      icon: AlertTriangle,
      label: 'Leads Estagnados',
      value: factors.stagnantLeads.status,
      className: getStatusColor(factors.stagnantLeads.status),
    },
    {
      icon: MessageCircle,
      label: 'Follow-up em dia',
      value: `${factors.followUpRate.percentage}%`,
      className: 'text-blue-600 bg-blue-50',
    },
  ]

  return (
    <div className="flex-1 grid grid-cols-2 gap-2" data-testid="health-score-metrics">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex items-center gap-2 p-2 rounded-lg"
        >
          <metric.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase truncate">
              {metric.label}
            </p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${metric.className}`}>
              {metric.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default HealthScoreMetrics
