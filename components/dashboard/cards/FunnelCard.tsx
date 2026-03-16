'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelData } from '@/types/dashboard';
import { useFunnelData } from '@/hooks/dashboard/useFunnelData';
import { FunnelSkeleton } from '@/components/dashboard/skeletons/FunnelSkeleton';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPercentage } from '@/lib/utils-format';

interface FunnelCardProps {
  className?: string;
}

/**
 * Card de Funil por Etapa
 * 
 * Exibe as etapas do funil de vendas com:
 * - Visualização em forma de funil (decrescente)
 * - Taxas de conversão por etapa
 * - Indicadores de tendência
 * - Resumo no footer
 */
export function FunnelCard({ className }: FunnelCardProps) {
  const { data, isLoading, isError, refetch } = useFunnelData();

  // Render skeleton durante loading
  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <FunnelSkeleton />
      </div>
    );
  }

  // Render error state
  if (isError || !data) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-red-500 text-sm">Erro ao carregar dados do funil</p>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Funil por Etapa</CardTitle>
        <span className="text-sm text-muted-foreground">{data.period}</span>
      </CardHeader>
      
      <CardContent>
        {/* Funnel Visualization */}
        <div className="space-y-2">
          {data.stages.map((stage, index) => (
            <FunnelStageRow 
              key={stage.id} 
              stage={stage} 
              index={index}
              totalStages={data.stages.length}
            />
          ))}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <StatBox 
            label="Total Leads" 
            value={formatNumber(data.totalLeads)} 
          />
          <StatBox 
            label="Conversões" 
            value={formatNumber(data.totalConversions)} 
          />
          <StatBox 
            label="Taxa Global" 
            value={formatPercentage(data.globalConversionRate)}
            highlight
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component: Funnel Stage Row
function FunnelStageRow({ 
  stage, 
  index,
  totalStages 
}: { 
  stage: FunnelData['stages'][0]; 
  index: number;
  totalStages: number;
}) {
  const widthPercent = 100 - (index * (60 / totalStages));
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center gap-2 transition-all duration-500"
        style={{ width: `${widthPercent}%` }}
      >
        <div 
          className="h-10 rounded-md flex items-center px-3 text-sm font-medium text-white shadow-sm"
          style={{ 
            backgroundColor: stage.color,
            width: '100%'
          }}
        >
          <span className="truncate">{stage.name}</span>
          <span className="ml-auto font-bold">{formatNumber(stage.count)}</span>
        </div>
      </div>
      
      {/* Conversion rate */}
      <div className="flex items-center gap-1 text-sm flex-shrink-0">
        <span className="font-semibold text-muted-foreground">
          {formatPercentage(stage.conversionRate)}
        </span>
        <TrendIndicator trend={stage.trend} value={stage.trendValue} />
      </div>
    </div>
  );
}

// Sub-component: Trend Indicator
function TrendIndicator({ 
  trend, 
  value 
}: { 
  trend: 'up' | 'down' | 'neutral'; 
  value: number;
}) {
  if (trend === 'neutral') {
    return <Minus className="w-4 h-4 text-gray-400" />;
  }
  
  const isPositive = trend === 'up';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      'flex items-center gap-0.5 text-xs',
      isPositive ? 'text-green-600' : 'text-red-600'
    )}>
      <Icon className="w-3 h-3" />
      <span>{value}%</span>
    </div>
  );
}

// Sub-component: Stat Box
function StatBox({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        'text-lg font-bold',
        highlight && 'text-primary'
      )}>
        {value}
      </p>
    </div>
  );
}
