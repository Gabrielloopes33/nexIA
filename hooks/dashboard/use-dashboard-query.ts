'use client'

import { 
  useQuery, 
  UseQueryOptions, 
  UseQueryResult,
  QueryKey,
  QueryFunction
} from '@tanstack/react-query'

/**
 * Configurações padrão para queries do dashboard
 */
export const DASHBOARD_QUERY_CONFIG = {
  // Stale times por tipo de dado
  staleTime: {
    kpis: 2 * 60 * 1000,        // 2 minutos - mudam com mais frequência
    charts: 5 * 60 * 1000,      // 5 minutos
    lists: 3 * 60 * 1000,       // 3 minutos
    static: 10 * 60 * 1000,     // 10 minutos
    default: 5 * 60 * 1000,     // 5 minutos padrão
  },
  
  // Retry configuration
  retry: 3,
  retryDelay: (attemptIndex: number): number => 
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  
  // Refetch behavior
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
} as const

/**
 * Opções estendidas para useDashboardQuery
 */
export interface UseDashboardQueryOptions<
  TData = unknown,
  TError = Error,
> extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey
  queryFn: QueryFunction<TData, QueryKey>
  /**
   * Tipo de dado para definir staleTime automaticamente
   */
  dataType?: 'kpis' | 'charts' | 'lists' | 'static' | 'default'
}

/**
 * Hook base para todas as queries do dashboard
 * 
 * Wrapper tipado em torno do React Query com configurações padrão
 * otimizadas para o dashboard.
 * 
 * @example
 * ```typescript
 * function useFunilPorEtapa() {
 *   const { period } = useDashboardFilters()
 *   
 *   return useDashboardQuery<FunilPorEtapaData>({
 *     queryKey: dashboardKeys.funilPorEtapa(period),
 *     queryFn: () => fetchFunilPorEtapa(period),
 *     dataType: 'charts', // Define staleTime automaticamente
 *   })
 * }
 * ```
 */
export function useDashboardQuery<
  TData = unknown,
  TError = Error,
>(options: UseDashboardQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  const { dataType = 'default', ...restOptions } = options
  
  // Define staleTime baseado no tipo de dado
  const staleTime = DASHBOARD_QUERY_CONFIG.staleTime[dataType]
  
  return useQuery<TData, TError, TData, QueryKey>({
    // Configurações padrão
    staleTime,
    retry: DASHBOARD_QUERY_CONFIG.retry,
    retryDelay: DASHBOARD_QUERY_CONFIG.retryDelay,
    refetchOnWindowFocus: DASHBOARD_QUERY_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: DASHBOARD_QUERY_CONFIG.refetchOnReconnect,
    refetchOnMount: DASHBOARD_QUERY_CONFIG.refetchOnMount,
    
    // Opções do usuário (podem sobrescrever padrões)
    ...restOptions,
  })
}

/**
 * Hook para queries que devem refetch ao focar a janela
 * Útil para dados críticos como KPIs em tempo real
 */
export function useDashboardRealtimeQuery<
  TData = unknown,
  TError = Error,
>(options: UseDashboardQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  return useDashboardQuery<TData, TError>({
    ...options,
    refetchOnWindowFocus: true,
    dataType: 'kpis',
  })
}

/**
 * Hook para queries com polling automático
 * Útil para atualizações periódicas
 */
export function useDashboardPollingQuery<
  TData = unknown,
  TError = Error,
>(
  options: UseDashboardQueryOptions<TData, TError>,
  intervalMs: number = 30000 // 30 segundos padrão
): UseQueryResult<TData, TError> {
  return useDashboardQuery<TData, TError>({
    ...options,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: false,
  })
}

export default useDashboardQuery
