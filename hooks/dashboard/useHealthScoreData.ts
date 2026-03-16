'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { HealthScoreData } from '@/types/dashboard';

async function fetchHealthScoreData(): Promise<HealthScoreData> {
  const response = await fetch('/api/dashboard/health-score');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch health score data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useHealthScoreData() {
  return useQuery({
    queryKey: dashboardKeys.healthScore(),
    queryFn: fetchHealthScoreData,
  });
}
