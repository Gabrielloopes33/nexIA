'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { KpisData } from '@/types/dashboard';

async function fetchKpisData(): Promise<KpisData> {
  const response = await fetch('/api/dashboard/kpis');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch KPIs data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useKpisData() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: fetchKpisData,
    // KPIs podem ser atualizados com mais frequência
    refetchInterval: 1000 * 60 * 2, // 2 minutos
  });
}
