'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { RecoveryData } from '@/types/dashboard';

async function fetchRecoveryData(): Promise<RecoveryData> {
  const response = await fetch('/api/dashboard/recovery');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recovery data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useRecoveryData() {
  return useQuery({
    queryKey: dashboardKeys.recovery(),
    queryFn: fetchRecoveryData,
  });
}
