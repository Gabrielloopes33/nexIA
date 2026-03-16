import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Performance por Canal
 * 
 * Exibe uma representação visual de carregamento com barras
 * simulando o gráfico de canais.
 */
export function PerformanceCanalSkeleton() {
  return (
    <div className="h-full space-y-4" data-testid="canais-skeleton">
      {/* Legend skeleton */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Bars skeleton */}
      <div className="flex items-end justify-center gap-4 h-[180px] pt-4">
        {[40, 60, 30, 50, 70, 45].map((height, i) => (
          <Skeleton 
            key={i} 
            className="w-12 rounded-t-md" 
            style={{ height: `${height}%` }} 
          />
        ))}
      </div>
    </div>
  )
}

export default PerformanceCanalSkeleton
