import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração global do React Query
 * 
 * Stale Time: 5 minutos - dados são considerados "frescos" por 5 min
 * Cache Time: 30 minutos - dados ficam em cache por 30 min após último uso
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos
      gcTime: 1000 * 60 * 30,         // 30 minutos (antigo cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

/**
 * Query keys para organização e invalidação seletiva
 * 
 * Uso:
 * - Invalidar todos: queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
 * - Invalidar apenas funil: queryClient.invalidateQueries({ queryKey: dashboardKeys.funnel() })
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  funnel: () => [...dashboardKeys.all, 'funnel'] as const,
  recovery: () => [...dashboardKeys.all, 'recovery'] as const,
  channels: () => [...dashboardKeys.all, 'channels'] as const,
  lossReasons: () => [...dashboardKeys.all, 'loss-reasons'] as const,
  revenue: () => [...dashboardKeys.all, 'revenue'] as const,
  healthScore: () => [...dashboardKeys.all, 'health-score'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
};
