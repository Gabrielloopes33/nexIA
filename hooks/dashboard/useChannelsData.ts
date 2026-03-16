'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/dashboard/queries';
import { ChannelsData } from '@/types/dashboard';

async function fetchChannelsData(): Promise<ChannelsData> {
  const response = await fetch('/api/dashboard/channels');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch channels data: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  
  return result.data;
}

export function useChannelsData() {
  return useQuery({
    queryKey: dashboardKeys.channels(),
    queryFn: fetchChannelsData,
  });
}
