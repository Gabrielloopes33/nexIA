'use client'

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'
import { DashboardPeriod, DateRange, UseDashboardFiltersReturn } from '@/types/dashboard-hooks'

/**
 * Tipo do contexto de filtros do dashboard
 */
interface DashboardFiltersContextType {
  /** Período selecionado */
  period: DashboardPeriod
  /** Função para alterar o período */
  setPeriod: (period: DashboardPeriod) => void
}

/**
 * Contexto para filtros do dashboard
 */
export const DashboardFiltersContext = createContext<DashboardFiltersContextType | undefined>(
  undefined
)

/**
 * Provider para filtros do dashboard
 * 
 * Gerencia o estado global do período selecionado e fornece
 * o range de datas calculado para todos os componentes filhos.
 * 
 * @example
 * ```tsx
 * <DashboardFiltersProvider>
 *   <DashboardPage />
 * </DashboardFiltersProvider>
 * ```
 */
export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<DashboardPeriod>('30d')

  const value = useMemo(
    () => ({
      period,
      setPeriod,
    }),
    [period]
  )

  return (
    <DashboardFiltersContext.Provider value={value}>
      {children}
    </DashboardFiltersContext.Provider>
  )
}

/**
 * Hook para acessar filtros do dashboard
 * 
 * @returns Período selecionado, função para alterar período e range de datas
 * @throws Error se usado fora do DashboardFiltersProvider
 * 
 * @example
 * ```typescript
 * const { period, setPeriod, dateRange } = useDashboardFilters()
 * ```
 */
export function useDashboardFilters(): UseDashboardFiltersReturn {
  const context = useContext(DashboardFiltersContext)
  if (!context) {
    throw new Error('useDashboardFilters must be used within DashboardFiltersProvider')
  }

  const { period, setPeriod } = context

  // Calcular dateRange baseado no período
  const getDateRange = useCallback((): DateRange => {
    const end = new Date()
    const start = new Date()
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
      default:
        start.setDate(start.getDate() - 30)
    }
    
    return { start, end }
  }, [period])

  const dateRange = useMemo(() => getDateRange(), [getDateRange])

  return {
    period,
    setPeriod,
    dateRange,
  }
}

export default useDashboardFilters
