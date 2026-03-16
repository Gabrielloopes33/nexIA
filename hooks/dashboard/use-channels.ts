'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { ChannelPerformance } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const CHANNELS_QUERY_KEY = 'dashboard-channels'

/**
 * Dados retornados pelo hook useChannels
 */
export interface ChannelsResponse {
  channels: ChannelPerformance[]
}

/**
 * Faz o fetch dos dados de performance por canal
 * @param period - Período selecionado
 * @returns Dados dos canais
 */
async function fetchChannels(period: DashboardPeriod): Promise<ChannelsResponse> {
  const response = await fetch(`/api/dashboard/channels?period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch channel data')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar performance por canal
 * 
 * @param period - Período selecionado ('today', '7d', '30d', '90d')
 * @returns Query result com dados dos canais e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useChannels('30d')
 * ```
 */
export function useChannels(period: DashboardPeriod): UseQueryResult<ChannelsResponse, Error> & { refetch: () => Promise<void> } {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [CHANNELS_QUERY_KEY, period],
    queryFn: () => fetchChannels(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, period] })
    },
  }
}

/**
 * Função para prefetch de dados de canais (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 */
export async function prefetchChannels(
  queryClient: ReturnType<typeof useQueryClient>,
  period: DashboardPeriod
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [CHANNELS_QUERY_KEY, period],
    queryFn: () => fetchChannels(period),
  })
}

export default useChannels
