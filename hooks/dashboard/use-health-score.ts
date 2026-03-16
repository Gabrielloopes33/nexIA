'use client'

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { HealthScore } from '@/types/dashboard'
import { DashboardPeriod } from '@/types/dashboard-hooks'

const HEALTH_SCORE_QUERY_KEY = 'dashboard-health-score'

export type HealthScoreStatus = 'SAUDÁVEL' | 'OK' | 'ATENÇÃO' | 'CRÍTICO'

export interface HealthScoreFactors {
  conversionVsGoal: {
    score: number
    status: 'ACIMA' | 'NA_META' | 'ABAIXO'
    actualRate: number
    targetRate: number
  }
  funnelVelocity: {
    score: number
    status: 'OK' | 'LENTO' | 'CRÍTICO'
    avgHours: number
  }
  stagnantLeads: {
    score: number
    status: 'OK' | 'ATENÇÃO' | 'CRÍTICO'
    count: number
    totalLeads: number
  }
  followUpRate: {
    score: number
    percentage: number
  }
}

export interface HealthScoreData {
  score: number
  status: HealthScoreStatus
  factors: HealthScoreFactors
}

export interface UseHealthScoreReturn extends UseQueryResult<HealthScoreData, Error> {
  refetch: () => Promise<void>
}

/**
 * Faz o fetch dos dados de health score
 * @param period - Período selecionado
 * @returns Dados de health score
 */
async function fetchHealthScore(period: DashboardPeriod): Promise<HealthScoreData> {
  const response = await fetch(`/api/dashboard/health-score?period=${period}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch health score')
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }
  
  return result.data
}

/**
 * Hook para buscar dados de health score
 * 
 * @param period - Período selecionado ('today', '7d', '30d', '90d')
 * @returns Query result com dados de health score e funções de controle
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useHealthScore('30d')
 * ```
 */
export function useHealthScore(period: DashboardPeriod): UseHealthScoreReturn {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: [HEALTH_SCORE_QUERY_KEY, period],
    queryFn: () => fetchHealthScore(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
  
  return {
    ...query,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: [HEALTH_SCORE_QUERY_KEY, period] })
    },
  }
}

/**
 * Função para prefetch de dados de health score (SSR)
 * 
 * @param queryClient - Instância do QueryClient
 * @param period - Período selecionado
 */
export async function prefetchHealthScore(
  queryClient: ReturnType<typeof useQueryClient>, 
  period: DashboardPeriod
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [HEALTH_SCORE_QUERY_KEY, period],
    queryFn: () => fetchHealthScore(period),
  })
}

export default useHealthScore
