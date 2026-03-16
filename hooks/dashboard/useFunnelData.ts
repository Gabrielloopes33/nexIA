'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { FunnelData } from '@/types/dashboard';

/**
 * Fetch function para dados do funil
 */
async function fetchFunnelData(): Promise<FunnelData> {
  const response = await fetch('/api/dashboard/funnel');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch funnel data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

/**
 * Hook para buscar dados do funil de vendas
 * 
 * @example
 * const { data, isLoading, isError, error, refetch } = useFunnelData();
 */
export function useFunnelData() {
  return useQuery({
    queryKey: dashboardKeys.funnel(),
    queryFn: fetchFunnelData,
    // Configurações específicas para este query
    staleTime: 1000 * 60 * 2, // 2 minutos (mais frequente que o padrão)
  });
}
