'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters-context'
import { DashboardPeriod } from '@/types/dashboard-hooks'

/**
 * Configuração dos períodos disponíveis
 */
const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
]

/**
 * Componente de filtros de período para o dashboard
 * 
 * Exibe botões para seleção do período de análise dos dados.
 * Usa o contexto de filtros do dashboard para gerenciar o estado.
 * 
 * @example
 * ```tsx
 * <PeriodFilters />
 * ```
 */
export function PeriodFilters() {
  const { period, setPeriod } = useDashboardFilters()

  return (
    <div className="flex items-center gap-2" data-testid="period-filters">
      <span className="text-sm text-muted-foreground mr-2">Período:</span>
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(p.value)}
          className={cn(
            'text-xs',
            period === p.value && 'bg-[#46347F] hover:bg-[#46347F]/90'
          )}
          data-testid={`period-button-${p.value}`}
          aria-pressed={period === p.value}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}

export default PeriodFilters
