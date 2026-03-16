'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { LostReasonTrend } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const LOST_REASONS_QUERY_KEY = 'dashboard-lost-reasons'

export interface LostReasonsData {
  reasons: LostReasonTrend[]
}

export interface UseLostReasonsReturn extends UseQueryResult<LostReasonsData, Error> {
  refetch: () => Promise<void>
}

/**
 * Faz o fetch dos dados de motivos de perda
 * @param period - Período selecionado
 * @returns Dados dos motivos de perda
 */
async function fetchLostReasons(period: DashboardPeriod): Promise<LostReasonsData> {
  const response = await fetch(`/api/dashboard/lost-reasons?period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch lost reasons')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar dados de motivos de perda
 * 
 * @param period - Período selecionado ('today', '7d', '30d', '90d')
 * @returns Query result com dados dos motivos de perda e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useLostReasons('30d')
 * ```
 */
export function useLostReasons(period: DashboardPeriod): UseLostReasonsReturn {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [LOST_REASONS_QUERY_KEY, period],
    queryFn: () => fetchLostReasons(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [LOST_REASONS_QUERY_KEY, period] })
    },
  }
}

/**
 * Função para prefetch de dados de motivos de perda (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 */
export async function prefetchLostReasons(
  queryClient: ReturnType<typeof useQueryClient>, 
  period: DashboardPeriod
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [LOST_REASONS_QUERY_KEY, period],
    queryFn: () => fetchLostReasons(period),
  })
}

export default useLostReasons
