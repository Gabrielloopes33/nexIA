'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { LossReasonsData } from '@/types/dashboard';

async function fetchLossReasonsData(): Promise<LossReasonsData> {
  const response = await fetch('/api/dashboard/loss-reasons');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loss reasons data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useLossReasonsData() {
  return useQuery({
    queryKey: dashboardKeys.lossReasons(),
    queryFn: fetchLossReasonsData,
  });
}
