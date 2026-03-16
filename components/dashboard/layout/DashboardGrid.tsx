'use client';

import { FunnelCard } from '@/components/dashboard/cards/FunnelCard';
import { RecoveryCard } from '@/components/dashboard/cards/RecoveryCard';
import { ChannelsCard } from '@/components/dashboard/cards/ChannelsCard';
import { LossReasonsCard } from '@/components/dashboard/cards/LossReasonsCard';
import { RevenueCard } from '@/components/dashboard/cards/RevenueCard';
import { HealthScoreCard } from '@/components/dashboard/cards/HealthScoreCard';

/**
 * Grid principal do dashboard
 * 
 * Layout:
 * Row 1: [Funnel (2fr)] [Recovery (1fr)]
 * Row 2: [Channels (1fr)] [Empty] [Empty]
 * Row 3: [Revenue (3fr - full width)]
 * Row 4: [LossReasons (1fr)] [Empty] [HealthScore (1fr)]
 */
export function DashboardGrid() {
  return (
    <div className="grid grid-cols-3 gap-6 auto-rows-min">
      {/* Row 1: Funnel (2fr) + Recovery (1fr) */}
      <div className="col-span-2">
        <FunnelCard className="h-[320px]" />
      </div>
      <div className="col-span-1">
        <RecoveryCard className="h-[320px]" />
      </div>
      
      {/* Row 2: Channels (1fr) */}
      <div className="col-span-1">
        <ChannelsCard className="h-[280px]" />
      </div>
      
      {/* Row 3: Revenue (3fr - full width) */}
      <div className="col-span-3">
        <RevenueCard className="h-[360px]" />
      </div>
      
      {/* Row 4: Loss Reasons (1fr) + Health Score (1fr) */}
      <div className="col-span-1">
        <LossReasonsCard className="h-[280px]" />
      </div>
      <div className="col-span-1 col-start-3">
        <HealthScoreCard className="h-[280px]" />
      </div>
    </div>
  );
}
