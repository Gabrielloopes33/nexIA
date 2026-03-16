import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

/**
 * Interface para um item de KPI
 */
export interface KpiItem {
  /** Label do KPI */
  label: string
  /** Valor do KPI (número ou string formatada) */
  value: string | number
  /** Variação percentual (ex: 5.2, -2.1) */
  trend?: number
  /** Label opcional para a tendência */
  trendLabel?: string
  /** Ícone opcional */
  icon?: LucideIcon
}

/**
 * Props do KpiCard
 */
export interface KpiCardProps {
  /** Label do KPI */
  label: string
  /** Valor do KPI */
  value: string | number
  /** Variação percentual */
  trend?: number
  /** Label opcional para a tendência */
  trendLabel?: string
  /** Ícone opcional */
  icon?: LucideIcon
  /** Classes adicionais */
  className?: string
}

/**
 * KpiCard - Card individual de KPI para sidebar
 * 
 * Design compacto para colunas estreitas (100px)
 * Mostra label, valor e variação com cores indicativas
 */
export function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  className,
}: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-slate-200 bg-white p-2.5',
        'transition-colors hover:border-slate-300',
        className
      )}
    >
      {/* Label */}
      <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider truncate leading-tight">
        {label}
      </p>

      {/* Value */}
      <div className="mt-1 flex items-center gap-1">
        {Icon && (
          <Icon className="h-3 w-3 text-slate-400 flex-shrink-0" />
        )}
        <span className="text-sm font-bold text-slate-900 truncate">
          {value}
        </span>
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div
          className={cn(
            'mt-1 flex items-center gap-0.5 text-[10px]',
            isPositive && 'text-emerald-600',
            isNegative && 'text-red-600'
          )}
        >
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          <span className="font-medium">
            {isPositive ? '+' : ''}{trend}%
          </span>
        </div>
      )}

      {/* Trend Label (opcional) */}
      {trendLabel && !trend && (
        <p className="mt-1 text-[9px] text-slate-400 truncate">
          {trendLabel}
        </p>
      )}
    </div>
  )
}

/**
 * Props do KpisSidebar
 */
export interface KpisSidebarProps {
  /** Array de KPIs para exibir */
  kpis: KpiItem[]
  /** Classes adicionais */
  className?: string
}

/**
 * KpisSidebar - Coluna vertical de KPIs
 * 
 * Layout compacto vertical com 100px de largura
 * Empilha os KPI cards verticalmente
 * 
 * @example
 * ```tsx
 * <KpisSidebar
 *   kpis={[
 *     { label: 'Leads', value: 123, trend: 5.2 },
 *     { label: 'Receita', value: 'R$ 45K', trend: 12.3 },
 *     { label: 'Conversão', value: '24%', trend: -2.1 },
 *   ]}
 * />
 * ```
 */
export function KpisSidebar({ kpis, className }: KpisSidebarProps) {
  return (
    <div
      className={cn(
        'w-[100px] flex flex-col gap-2',
        className
      )}
    >
      {kpis.map((kpi, index) => (
        <KpiCard
          key={`${kpi.label}-${index}`}
          label={kpi.label}
          value={kpi.value}
          trend={kpi.trend}
          trendLabel={kpi.trendLabel}
          icon={kpi.icon}
        />
      ))}
    </div>
  )
}

export default KpisSidebar
