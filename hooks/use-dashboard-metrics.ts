/**
 * React Hooks para Dashboard Metrics (SWR)
 * 
 * Hooks customizados para buscar métricas do dashboard com
 * caching automático, revalidação e estado de loading.
 * 
 * @module hooks/use-dashboard-metrics
 */

import useSWR, { SWRConfiguration } from 'swr'
import {
  FunnelMetrics,
  LostDealsMetrics,
  ChannelPerformance,
  LostReasonTrend,
  RevenueMetrics,
  HealthScore,
  KPIs,
  DashboardMetrics,
  PeriodParam,
} from '@/types/dashboard'

// ============================================
// CONFIGURAÇÃO DO SWR
// ============================================

const defaultConfig: SWRConfiguration = {
  refreshInterval: 5 * 60 * 1000, // 5 minutos
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  dedupingInterval: 2000, // 2 segundos
}

// Fetcher padrão
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao buscar dados')
  }
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Erro ao buscar dados')
  }
  return data.data
}

// ============================================
// HOOKS INDIVIDUAIS
// ============================================

/**
 * Hook para métricas do funil por etapa
 */
export function useFunnelMetrics(
  organizationId: string | undefined,
  period: PeriodParam = '30d',
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/funnel?organizationId=${organizationId}&period=${period}`
    : null

  const { data, error, isLoading, mutate } = useSWR<FunnelMetrics>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  )

  return {
    funnel: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para métricas de deals perdidos
 */
export function useLostDealsMetrics(
  organizationId: string | undefined,
  days: number = 30,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/lost-deals?organizationId=${organizationId}&days=${days}`
    : null

  const { data, error, isLoading, mutate } = useSWR<LostDealsMetrics>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  )

  return {
    lostDeals: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para performance por canal
 */
export function useChannelPerformance(
  organizationId: string | undefined,
  days: number = 30,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/channels?organizationId=${organizationId}&days=${days}`
    : null

  const { data, error, isLoading, mutate } = useSWR<ChannelPerformance[]>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  )

  return {
    channels: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para análise de motivos de perda
 */
export function useLostReasonsTrend(
  organizationId: string | undefined,
  currentDays: number = 30,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/lost-reasons?organizationId=${organizationId}&currentDays=${currentDays}`
    : null

  const { data, error, isLoading, mutate } = useSWR<LostReasonTrend[]>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  )

  return {
    lostReasons: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para receita semanal
 */
export function useRevenueMetrics(
  organizationId: string | undefined,
  weeks: number = 8,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/revenue?organizationId=${organizationId}&weeks=${weeks}`
    : null

  const { data, error, isLoading, mutate } = useSWR<RevenueMetrics>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  )

  return {
    revenue: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para health score
 */
export function useHealthScore(
  organizationId: string | undefined,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/health-score?organizationId=${organizationId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<HealthScore>(
    url,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 10 * 60 * 1000, // 10 minutos (cálculo mais pesado)
      ...config,
    }
  )

  return {
    healthScore: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para KPIs verticais
 */
export function useKPIs(
  organizationId: string | undefined,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/kpis?organizationId=${organizationId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<KPIs>(
    url,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 2 * 60 * 1000, // 2 minutos (dados mais voláteis)
      ...config,
    }
  )

  return {
    kpis: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook para todas as métricas consolidadas
 * Usa o endpoint /api/dashboard/all com cache no banco
 */
export function useAllDashboardMetrics(
  organizationId: string | undefined,
  config?: SWRConfiguration
) {
  const url = organizationId
    ? `/api/dashboard/all?organizationId=${organizationId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<DashboardMetrics>(
    url,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: 5 * 60 * 1000, // 5 minutos
      ...config,
    }
  )

  return {
    metrics: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

// ============================================
// HOOK COMPOSTO (RECOMENDADO)
// ============================================

/**
 * Hook composto que busca todas as métricas em paralelo
 * usando SWR preload ou individualmente
 */
export function useDashboard(
  organizationId: string | undefined,
  options?: {
    enableFunnel?: boolean
    enableLostDeals?: boolean
    enableChannels?: boolean
    enableLostReasons?: boolean
    enableRevenue?: boolean
    enableHealthScore?: boolean
    enableKPIs?: boolean
    period?: PeriodParam
    days?: number
    weeks?: number
  }
) {
  const {
    enableFunnel = true,
    enableLostDeals = true,
    enableChannels = true,
    enableLostReasons = true,
    enableRevenue = true,
    enableHealthScore = true,
    enableKPIs = true,
    period = '30d',
    days = 30,
    weeks = 8,
  } = options || {}

  const funnel = useFunnelMetrics(
    enableFunnel ? organizationId : undefined,
    period
  )
  const lostDeals = useLostDealsMetrics(
    enableLostDeals ? organizationId : undefined,
    days
  )
  const channels = useChannelPerformance(
    enableChannels ? organizationId : undefined,
    days
  )
  const lostReasons = useLostReasonsTrend(
    enableLostReasons ? organizationId : undefined,
    days
  )
  const revenue = useRevenueMetrics(
    enableRevenue ? organizationId : undefined,
    weeks
  )
  const healthScore = useHealthScore(
    enableHealthScore ? organizationId : undefined
  )
  const kpis = useKPIs(enableKPIs ? organizationId : undefined)

  const isLoading =
    funnel.isLoading ||
    lostDeals.isLoading ||
    channels.isLoading ||
    lostReasons.isLoading ||
    revenue.isLoading ||
    healthScore.isLoading ||
    kpis.isLoading

  const error =
    funnel.error ||
    lostDeals.error ||
    channels.error ||
    lostReasons.error ||
    revenue.error ||
    healthScore.error ||
    kpis.error

  const refresh = () => {
    funnel.refresh()
    lostDeals.refresh()
    channels.refresh()
    lostReasons.refresh()
    revenue.refresh()
    healthScore.refresh()
    kpis.refresh()
  }

  return {
    funnel: funnel.funnel,
    lostDeals: lostDeals.lostDeals,
    channels: channels.channels,
    lostReasons: lostReasons.lostReasons,
    revenue: revenue.revenue,
    healthScore: healthScore.healthScore,
    kpis: kpis.kpis,
    isLoading,
    error,
    refresh,
  }
}

// ============================================
// FUNÇÕES DE PRELOAD (Para SSR/prefetch)
// ============================================

import { preload } from 'swr'

export function preloadDashboardMetrics(organizationId: string) {
  const url = `/api/dashboard/all?organizationId=${organizationId}`
  return preload(url, fetcher)
}

export function preloadFunnelMetrics(
  organizationId: string,
  period: PeriodParam = '30d'
) {
  const url = `/api/dashboard/funnel?organizationId=${organizationId}&period=${period}`
  return preload(url, fetcher)
}

export function preloadKPIs(organizationId: string) {
  const url = `/api/dashboard/kpis?organizationId=${organizationId}`
  return preload(url, fetcher)
}
