'use client'

import { useContext } from 'react'
import { DashboardContext } from '@/hooks/use-dashboard-context'
import { DashboardPeriod } from '@/types/dashboard'

/**
 * Hook para acessar filtros globais do dashboard
 * 
 * Este hook deve ser usado por todos os cards que precisam
 * reagir a mudanças de período ou filtros de usuário.
 * 
 * @example
 * ```typescript
 * function useFunilPorEtapa() {
 *   const { period, dateRange } = useDashboardFilters()
 *   
 *   return useDashboardQuery({
 *     queryKey: dashboardKeys.funilPorEtapa(period),
 *     queryFn: () => fetchFunil(dateRange),
 *   })
 * }
 * ```
 */
export function useDashboardFilters() {
  const context = useContext(DashboardContext)
  
  if (context === undefined) {
    throw new Error(
      'useDashboardFilters must be used within a DashboardProvider'
    )
  }
  
  return {
    // Período selecionado ('7d', '30d', '90d')
    period: context.period,
    
    // Range de datas calculado
    dateRange: context.dateRange,
    
    // Usuários selecionados para filtro
    selectedUsers: context.selectedUsers,
    
    // Actions
    setPeriod: context.setPeriod,
    toggleUser: context.toggleUser,
    setSelectedUsers: context.setSelectedUsers,
    
    // Refresh global
    refreshTrigger: context.refreshTrigger,
    refresh: context.refresh,
  }
}

/**
 * Hook específico para controle de período
 * Útil quando o componente só precisa mudar o período
 */
export function usePeriodSelector() {
  const { period, setPeriod } = useDashboardFilters()
  
  const periods: { value: DashboardPeriod; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
  ]
  
  return {
    period,
    setPeriod,
    periods,
  }
}

/**
 * Hook específico para controle de filtros de usuário
 */
export function useUserFilters() {
  const { selectedUsers, toggleUser, setSelectedUsers } = useDashboardFilters()
  
  return {
    selectedUsers,
    toggleUser,
    setSelectedUsers,
    hasUsersSelected: selectedUsers.length > 0,
    isUserSelected: (userId: string) => selectedUsers.includes(userId),
    clearUsers: () => setSelectedUsers([]),
  }
}

export default useDashboardFilters
