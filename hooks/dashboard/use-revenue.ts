'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { WeeklyRevenue } from '@/types/dashboard'

const REVENUE_QUERY_KEY = 'dashboard-revenue'

export interface RevenueData {
  weeks: WeeklyRevenue[]
}

export interface UseRevenueReturn extends UseQueryResult<RevenueData, Error> {
  refetch: () => Promise<void>
}

/**
 * Faz o fetch dos dados de receita semanal
 * @param weeks - Número de semanas para buscar
 * @returns Dados de receita
 */
async function fetchRevenue(weeks: number = 8): Promise<RevenueData> {
  const response = await fetch(`/api/dashboard/revenue?weeks=${weeks}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch revenue data')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar dados de receita semanal
 * 
 * @param weeks - Número de semanas para buscar (padrão: 8)
 * @returns Query result com dados de receita e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useRevenue(8)
 * ```
 */
export function useRevenue(weeks: number = 8): UseRevenueReturn {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [REVENUE_QUERY_KEY, weeks],
    queryFn: () => fetchRevenue(weeks),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [REVENUE_QUERY_KEY, weeks] })
    },
  }
}

/**
 * Função para prefetch de dados de receita (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param weeks - Número de semanas para buscar
 */
export async function prefetchRevenue(
  queryClient: ReturnType<typeof useQueryClient>, 
  weeks: number = 8
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [REVENUE_QUERY_KEY, weeks],
    queryFn: () => fetchRevenue(weeks),
  })
}

export default useRevenue
