import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Funil por Etapa
 * 
 * Exibe uma representação visual de carregamento com barras
 * simulando o gráfico de funil.
 */
export function FunilPorEtapaSkeleton() {
  return (
    <div className="h-full space-y-4" data-testid="funil-skeleton">
      {/* Header skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Barras do funil skeleton */}
      <div className="space-y-3 pt-4">
        {[100, 75, 60, 45, 30].map((width, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton 
              className="h-8 rounded-md" 
              style={{ width: `${width}%` }} 
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FunilPorEtapaSkeleton
