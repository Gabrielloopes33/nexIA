'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChannelsData } from '@/hooks/dashboard/useChannelsData';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { formatNumber, formatPercentage } from '@/lib/utils-format';

interface ChannelsCardProps {
  className?: string;
}

const channelIcons: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  email: '📧',
  phone: '📞',
  website: '🌐',
  referral: '👥',
};

/**
 * Card de Performance por Canal
 */
export function ChannelsCard({ className }: ChannelsCardProps) {
  const { data, isLoading, isError } = useChannelsData();

  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <ChartSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-red-500">Erro ao carregar canais</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Canais</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Top Channel Highlight */}
        <div className="p-3 bg-primary/5 rounded-lg mb-4">
          <p className="text-xs text-muted-foreground mb-1">Top Canal</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{channelIcons[data.topChannel]}</span>
            <div>
              <p className="font-semibold capitalize">{data.topChannel}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data.totalRevenue)} total
              </p>
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="space-y-2">
          {data.channels.slice(0, 4).map((channel) => (
            <div key={channel.channel} className="flex items-center gap-2">
              <span className="text-lg">{channelIcons[channel.channel]}</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{channel.channel}</span>
                  <span className="font-medium">
                    {formatPercentage(channel.conversionRate)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${channel.conversionRate * 5}%`,
                      backgroundColor: channel.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
