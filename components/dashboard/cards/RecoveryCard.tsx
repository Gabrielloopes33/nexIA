'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecoveryData } from '@/hooks/dashboard/useRecoveryData';
import { ListSkeleton } from '@/components/dashboard/skeletons/ListSkeleton';
import { RefreshCw, UserPlus, TrendingUp } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { formatNumber } from '@/lib/utils-format';

interface RecoveryCardProps {
  className?: string;
}

/**
 * Card de Recuperação de Leads Perdidos
 */
export function RecoveryCard({ className }: RecoveryCardProps) {
  const { data, isLoading, isError, refetch } = useRecoveryData();

  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <ListSkeleton itemCount={4} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-red-500 text-sm">Erro ao carregar</p>
          <button onClick={() => refetch()} className="text-primary hover:underline text-sm">
            Tentar novamente
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Recuperação
        </CardTitle>
        <span className="text-2xl font-bold text-primary">{data.totalCount}</span>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Potencial</p>
            <p className="font-bold text-primary">{formatCurrency(data.totalPotentialValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Prob. Média</p>
            <p className="font-bold">{data.avgRecoveryProbability}%</p>
          </div>
        </div>

        {/* Top leads list */}
        <div className="flex-1 space-y-2 overflow-auto">
          {data.leads.slice(0, 4).map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">
                  {lead.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{lead.recoveryProbability}%</p>
                <p className="text-xs text-green-600">
                  {formatCurrency(lead.potentialValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
