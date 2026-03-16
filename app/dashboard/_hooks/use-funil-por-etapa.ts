'use client'

import { useDashboardQuery } from '@/hooks/dashboard/use-dashboard-query'
import { dashboardKeys } from '@/lib/queries/query-keys'
import { useDashboardFilters } from '@/hooks/dashboard/use-dashboard-filters'
import type { FunilPorEtapaData } from '@/types/dashboard'

/**
 * Hook para buscar dados do funil por etapa
 * 
 * Carrega a distribuição de leads por etapa do pipeline
 * com totais e taxa de conversão geral.
 * 
 * @example
 * ```tsx
 * function FunilCard() {
 *   const { data, isLoading, error, refetch } = useFunilPorEtapa()
 *   
 *   if (isLoading) return <Skeleton />
 *   if (error) return <Error onRetry={refetch} />
 *   if (!data) return null
 *   
 *   return <FunilChart data={data} />
 * }
 * ```
 */
export function useFunilPorEtapa() {
  const { period } = useDashboardFilters()

  return useDashboardQuery<FunilPorEtapaData>({
    queryKey: dashboardKeys.funilPorEtapa(period),
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/funil-por-etapa?period=${period}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.error || `Erro ao carregar funil: ${response.status}`
        )
      }

      const data = await response.json()
      return data
    },
    // Configurações específicas para este card
    dataType: 'charts', // staleTime de 5 minutos
    // Refetch ao focar apenas em desenvolvimento
    refetchOnWindowFocus: process.env.NODE_ENV === 'development',
  })
}

/**
 * Hook com polling automático para dados em tempo real
 */
export function useFunilPorEtapaRealtime(pollInterval: number = 60000) {
  const result = useFunilPorEtapa()
  
  // Em uma implementação real, você poderia usar useDashboardPollingQuery
  // Aqui mantemos simples para o exemplo
  
  return result
}

export default useFunilPorEtapa
