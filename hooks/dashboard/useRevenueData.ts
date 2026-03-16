'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { RevenueData } from '@/types/dashboard';

async function fetchRevenueData(): Promise<RevenueData> {
  const response = await fetch('/api/dashboard/revenue');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch revenue data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useRevenueData() {
  return useQuery({
    queryKey: dashboardKeys.revenue(),
    queryFn: fetchRevenueData,
  });
}
