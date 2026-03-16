// Dashboard hooks barrel export

export { 
  useDashboardQuery, 
  useDashboardRealtimeQuery,
  useDashboardPollingQuery,
  DASHBOARD_QUERY_CONFIG,
  type UseDashboardQueryOptions 
} from './use-dashboard-query'

export { 
  useDashboardFilters, 
  usePeriodSelector,
  useUserFilters 
} from './use-dashboard-filters'

// Novos hooks com suporte a período
export { 
  useFunnel, 
  prefetchFunnel 
} from './use-funnel'

export { 
  useLostDeals, 
  prefetchLostDeals,
  type LostDealsResponse 
} from './use-lost-deals'

export { 
  useChannels, 
  prefetchChannels,
  type ChannelsResponse 
} from './use-channels'

// Hooks dos novos cards
export {
  useLostReasons,
  prefetchLostReasons,
  type LostReasonsData,
  type UseLostReasonsReturn
} from './use-lost-reasons'

export {
  useRevenue,
  prefetchRevenue,
  type RevenueData,
  type UseRevenueReturn
} from './use-revenue'

export {
  useHealthScore,
  prefetchHealthScore,
  type HealthScoreData,
  type HealthScoreFactors,
  type HealthScoreStatus,
  type UseHealthScoreReturn
} from './use-health-score'

// Novo provider de filtros
export {
  DashboardFiltersProvider,
  useDashboardFilters as useDashboardFiltersContext,
  DashboardFiltersContext
} from './use-dashboard-filters-context.tsx'
