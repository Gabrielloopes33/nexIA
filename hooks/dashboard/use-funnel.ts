'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { FunnelMetrics } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const FUNNEL_QUERY_KEY = 'dashboard-funnel'

/**
 * Faz o fetch dos dados do funil
 * @param period - Período selecionado
 * @returns Dados do funil
 */
async function fetchFunnel(period: DashboardPeriod): Promise<FunnelMetrics> {
  const response = await fetch(`/api/dashboard/funnel?period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch funnel data')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar dados do funil de vendas
 * 
 * @param period - Período selecionado ('today', '7d', '30d', '90d')
 * @returns Query result com dados do funil e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useFunnel('30d')
 * ```
 */
export function useFunnel(period: DashboardPeriod): UseQueryResult<FunnelMetrics, Error> & { refetch: () => Promise<void> } {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [FUNNEL_QUERY_KEY, period],
    queryFn: () => fetchFunnel(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [FUNNEL_QUERY_KEY, period] })
    },
  }
}

/**
 * Função para prefetch de dados do funil (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 */
export async function prefetchFunnel(queryClient: ReturnType<typeof useQueryClient>, period: DashboardPeriod): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [FUNNEL_QUERY_KEY, period],
    queryFn: () => fetchFunnel(period),
  })
}

export default useFunnel
