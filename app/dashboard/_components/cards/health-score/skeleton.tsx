import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Health Score
 * 
 * Exibe uma representação visual de carregamento com
 * círculo e grid de métricas.
 */
export function HealthScoreSkeleton() {
  return (
    <div className="flex items-center gap-4 h-full" data-testid="health-score-skeleton">
      {/* Gauge skeleton */}
      <Skeleton className="w-[120px] h-[120px] rounded-full flex-shrink-0" />
      
      {/* Metrics skeleton */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2 space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default HealthScoreSkeleton
