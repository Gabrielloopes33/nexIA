'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLossReasonsData } from '@/hooks/dashboard/useLossReasonsData';
import { ListSkeleton } from '@/components/dashboard/skeletons/ListSkeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { formatNumber } from '@/lib/utils-format';
import { AlertTriangle } from 'lucide-react';

interface LossReasonsCardProps {
  className?: string;
}

/**
 * Card de Motivos de Perda
 */
export function LossReasonsCard({ className }: LossReasonsCardProps) {
  const { data, isLoading, isError } = useLossReasonsData();

  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <ListSkeleton itemCount={5} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-red-500">Erro ao carregar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Perdas
        </CardTitle>
        <span className="text-2xl font-bold text-red-500">{data.totalLost}</span>
      </CardHeader>
      
      <CardContent className="flex-1">
        {/* Total Lost Revenue */}
        <div className="p-3 bg-red-50 rounded-lg mb-4">
          <p className="text-xs text-red-600 mb-1">Receita Perdida</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(data.totalRevenueLost)}
          </p>
        </div>

        {/* Reasons List */}
        <div className="space-y-2">
          {data.reasons.map((reason) => (
            <div key={reason.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: reason.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{reason.reason}</span>
                  <span className="font-medium text-muted-foreground">
                    {reason.count}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${reason.percentage}%`,
                      backgroundColor: reason.color,
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
