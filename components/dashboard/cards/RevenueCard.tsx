'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRevenueData } from '@/hooks/dashboard/useRevenueData';
import { ChartSkeleton } from '@/components/dashboard/skeletons/ChartSkeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Target, DollarSign } from 'lucide-react';

interface RevenueCardProps {
  className?: string;
}

/**
 * Card de Receita Semanal (Gráfico de Linha)
 * 
 * Exibe:
 * - Gráfico de linha com 8 semanas
 * - Comparação com meta
 * - Indicadores de performance
 */
export function RevenueCard({ className }: RevenueCardProps) {
  const { data, isLoading, isError } = useRevenueData();

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
          <p className="text-red-500">Erro ao carregar receita</p>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.weeks.map(w => Math.max(w.revenue, w.target)));

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Receita Semanal
        </CardTitle>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{data.period}</span>
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            +{data.growthRate}%
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatBox 
            label="Total Receita" 
            value={formatCurrency(data.totalRevenue)} 
            icon={DollarSign}
            color="green"
          />
          <StatBox 
            label="Meta" 
            value={formatCurrency(data.totalTarget)} 
            icon={Target}
            color="blue"
          />
          <StatBox 
            label="Atingimento" 
            value={`${data.achievementRate.toFixed(1)}%`} 
            icon={TrendingUp}
            color={data.achievementRate >= 100 ? 'green' : 'amber'}
          />
          <StatBox 
            label="Ticket Médio" 
            value={formatCurrency(data.avgDealValue)} 
            icon={DollarSign}
            color="purple"
          />
        </div>

        {/* Simple Bar Chart */}
        <div className="h-48 relative">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px bg-gray-100 w-full" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
            {data.weeks.map((week, index) => {
              const revenueHeight = (week.revenue / maxRevenue) * 100;
              const targetHeight = (week.target / maxRevenue) * 100;
              
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                  {/* Revenue bar */}
                  <div className="w-full relative">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${revenueHeight * 0.8}%` }}
                      title={`${week.week}: ${formatCurrency(week.revenue)}`}
                    />
                  </div>
                  {/* Week label */}
                  <span className="text-xs text-muted-foreground">{week.week}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-sm text-muted-foreground">Receita Realizada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300" />
            <span className="text-sm text-muted-foreground">Meta</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ 
  label, 
  value, 
  icon: Icon,
  color 
}: { 
  label: string; 
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs opacity-70">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
