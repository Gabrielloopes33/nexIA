'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealthScoreData } from '@/hooks/dashboard/useHealthScoreData';
import { CircleSkeleton } from '@/components/dashboard/skeletons/CircleSkeleton';
import { cn } from '@/lib/utils';
import { Heart, TrendingUp, TrendingDown } from 'lucide-react';

interface HealthScoreCardProps {
  className?: string;
}

/**
 * Card de Health Score
 * 
 * Exibe:
 * - Círculo com score 0-100
 * - Rating (excellent, good, average, poor, critical)
 * - Comparação com score anterior
 */
export function HealthScoreCard({ className }: HealthScoreCardProps) {
  const { data, isLoading, isError } = useHealthScoreData();

  if (isLoading) {
    return (
      <div className={cn('h-full', className)}>
        <CircleSkeleton />
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

  const scoreChange = data.overallScore - data.previousScore;
  const isPositiveChange = scoreChange > 0;

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Health Score
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        {/* Circle Score */}
        <div className="relative mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-100"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(data.overallScore / 100) * 351.86} 351.86`}
              className={getScoreColor(data.overallScore)}
              style={{
                transition: 'stroke-dasharray 0.5s ease',
              }}
            />
          </svg>
          
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{data.overallScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Rating Badge */}
        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-medium mb-3',
          getRatingBadgeColor(data.rating)
        )}>
          {getRatingLabel(data.rating)}
        </div>

        {/* Change indicator */}
        <div className="flex items-center gap-1 text-sm">
          {isPositiveChange ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+{scoreChange}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600">{scoreChange}</span>
            </>
          )}
          <span className="text-muted-foreground ml-1">vs anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bom',
    average: 'Médio',
    poor: 'Fraco',
    critical: 'Crítico',
  };
  return labels[rating] || rating;
}

function getRatingBadgeColor(rating: string): string {
  const colors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    average: 'bg-amber-100 text-amber-700',
    poor: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return colors[rating] || 'bg-gray-100 text-gray-700';
}
