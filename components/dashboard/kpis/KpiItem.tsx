'use client';

import { KpiData } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage, formatDuration } from '@/lib/utils-format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KpiSkeleton } from '../skeletons/KpiSkeleton';

interface KpiItemProps {
  kpi?: KpiData;
  isLoading?: boolean;
}

/**
 * Componente individual de KPI
 * 
 * Exibe:
 * - Label do KPI
 * - Valor formatado (número, moeda, percentual ou duração)
 * - Indicador de tendência com variação percentual
 */
export function KpiItem({ kpi, isLoading = false }: KpiItemProps) {
  if (isLoading) {
    return <KpiSkeleton />;
  }

  if (!kpi) {
    return null;
  }

  const formattedValue = formatKpiValue(kpi);
  const TrendIcon = getTrendIcon(kpi.trend);
  const trendColor = getTrendColor(kpi.trend, kpi.changeType);

  return (
    <div className="flex flex-col items-center justify-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer group">
      <span className="text-xs text-muted-foreground text-center mb-1 group-hover:text-foreground transition-colors">
        {kpi.label}
      </span>
      
      <span className="text-lg font-bold text-foreground">
        {formattedValue}
      </span>
      
      <div className={cn('flex items-center gap-1 text-xs mt-1', trendColor)}>
        <TrendIcon className="w-3 h-3" />
        <span>{Math.abs(kpi.change)}%</span>
      </div>
    </div>
  );
}

/**
 * Formata o valor do KPI baseado no tipo
 */
function formatKpiValue(kpi: KpiData): string {
  const { value, format, prefix, suffix } = kpi;
  
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'duration':
      return formatDuration(value);
    case 'number':
    default:
      return `${prefix || ''}${formatNumber(value)}${suffix || ''}`;
  }
}

/**
 * Retorna o ícone apropriado para a tendência
 */
function getTrendIcon(trend: KpiData['trend']) {
  switch (trend) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
}

/**
 * Determina a cor da tendência considerando o tipo de mudança
 * 
 * Para alguns KPIs (como tempo de conversão), down pode ser positivo
 */
function getTrendColor(trend: KpiData['trend'], changeType: KpiData['changeType']) {
  // Se o changeType é 'positive', verde independente da direção
  // Se é 'negative', vermelho independente da direção
  if (changeType === 'positive') return 'text-green-600';
  if (changeType === 'negative') return 'text-red-600';
  
  // Caso neutro, usar direção do trend
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-400';
  }
}
