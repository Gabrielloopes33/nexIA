import { UseQueryResult } from '@tanstack/react-query'
import {
  FunnelMetrics,
  LostDeal,
  ChannelPerformance,
} from './dashboard'

/**
 * Períodos disponíveis para o dashboard
 */
export type DashboardPeriod = 'today' | '7d' | '30d' | '90d'

/**
 * Range de datas calculado a partir do período
 */
export interface DateRange {
  start: Date
  end: Date
}

// ============================================
// HOOK DE FILTROS
// ============================================

/**
 * Retorno do hook useDashboardFilters
 */
export interface UseDashboardFiltersReturn {
  /** Período selecionado */
  period: DashboardPeriod
  /** Função para alterar o período */
  setPeriod: (period: DashboardPeriod) => void
  /** Range de datas calculado */
  dateRange: DateRange
}

// ============================================
// HOOKS DE DADOS
// ============================================

/**
 * Retorno do hook useFunnel
 */
export interface UseFunnelReturn extends UseQueryResult<FunnelMetrics, Error> {
  /** Função para forçar refetch */
  refetch: () => Promise<void>
}

/**
 * Dados de recuperação de perdidos
 */
export interface LostDealsData {
  deals: LostDeal[]
}

/**
 * Retorno do hook useLostDeals
 */
export interface UseLostDealsReturn extends UseQueryResult<LostDealsData, Error> {
  /** Função para forçar refetch */
  refetch: () => Promise<void>
}

/**
 * Dados de canais
 */
export interface ChannelsData {
  channels: ChannelPerformance[]
}

/**
 * Retorno do hook useChannels
 */
export interface UseChannelsReturn extends UseQueryResult<ChannelsData, Error> {
  /** Função para forçar refetch */
  refetch: () => Promise<void>
}
