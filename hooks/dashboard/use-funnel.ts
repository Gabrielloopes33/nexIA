'use client'

import { useQuery, UseQueryResult, QueryClient } from '@tanstack/react-query'
import { FunnelMetrics } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const FUNNEL_QUERY_KEY = 'dashboard-funnel'

/**
 * Faz o fetch dos dados do funil
 * @param period - Período selecionado
 * @param pipelineId - ID do pipeline (opcional, usa o padrão se não informado)
 * @returns Dados do funil
 */
async function fetchFunnel(period: DashboardPeriod, pipelineId?: string | null): Promise<FunnelMetrics> {
  const params = new URLSearchParams({ period })
  if (pipelineId) {
    params.append('pipelineId', pipelineId)
  }
  
  const response = await fetch(`/api/dashboard/funnel?${params.toString()}`)
  
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
 * @param pipelineId - ID do pipeline para filtrar (opcional)
 * @returns Query result com dados do funil e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useFunnel('30d')
 * // ou com pipeline específico
 * const { data } = useFunnel('30d', 'pipeline-id-123')
 * ```
 */
export function useFunnel(
  period: DashboardPeriod, 
  pipelineId?: string | null
): UseQueryResult<FunnelMetrics, Error> {
  return useQuery({
    queryKey: [FUNNEL_QUERY_KEY, period, pipelineId],
    queryFn: () => fetchFunnel(period, pipelineId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Função para prefetch de dados do funil (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 * @param pipelineId - ID do pipeline (opcional)
 */
export async function prefetchFunnel(
  queryClient: QueryClient, 
  period: DashboardPeriod,
  pipelineId?: string | null
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [FUNNEL_QUERY_KEY, period, pipelineId],
    queryFn: () => fetchFunnel(period, pipelineId),
  })
}

export default useFunnel
