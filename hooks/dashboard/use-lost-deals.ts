'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { LostDeal } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const LOST_DEALS_QUERY_KEY = 'dashboard-lost-deals'

/**
 * Dados retornados pelo hook useLostDeals
 */
export interface LostDealsResponse {
  deals: LostDeal[]
}

/**
 * Faz o fetch dos leads perdidos com potencial de recuperação
 * @param period - Período selecionado
 * @param limit - Limite de resultados (padrão: 10)
 * @returns Dados dos leads perdidos
 */
async function fetchLostDeals(
  period: DashboardPeriod,
  limit: number = 10
): Promise<LostDealsResponse> {
  const response = await fetch(`/api/dashboard/lost-deals?period=${period}&limit=${limit}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch lost deals')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar leads perdidos com potencial de recuperação
 * 
 * @param period - Período selecionado ('today', '7d', '30d', '90d')
 * @param limit - Limite de resultados (padrão: 10, max: 50)
 * @returns Query result com dados dos leads perdidos e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useLostDeals('30d', 5)
 * ```
 */
export function useLostDeals(
  period: DashboardPeriod,
  limit: number = 10
): UseQueryResult<LostDealsResponse, Error> & { refetch: () => Promise<void> } {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [LOST_DEALS_QUERY_KEY, period, limit],
    queryFn: () => fetchLostDeals(period, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [LOST_DEALS_QUERY_KEY, period, limit] })
    },
  }
}

/**
 * Função para prefetch de dados de leads perdidos (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 * @param limit - Limite de resultados
 */
export async function prefetchLostDeals(
  queryClient: ReturnType<typeof useQueryClient>,
  period: DashboardPeriod,
  limit: number = 10
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [LOST_DEALS_QUERY_KEY, period, limit],
    queryFn: () => fetchLostDeals(period, limit),
  })
}

export default useLostDeals
