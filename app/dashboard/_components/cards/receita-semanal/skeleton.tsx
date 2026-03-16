import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Receita Semanal
 * 
 * Exibe uma representação visual de carregamento com
 * barras simulando o gráfico de linha.
 */
export function ReceitaSemanalSkeleton() {
  return (
    <div className="h-full space-y-4" data-testid="receita-semanal-skeleton">
      {/* Legendas skeleton */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
      
      {/* Barras simulando o gráfico */}
      <div className="flex items-end justify-between h-[120px] px-4">
        {[30, 50, 40, 70, 60, 80, 55, 65].map((height, i) => (
          <Skeleton 
            key={i} 
            className="w-6 rounded-t" 
            style={{ height: `${height}%` }} 
          />
        ))}
      </div>
      
      {/* Eixo X skeleton */}
      <div className="flex justify-between px-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-3 w-6" />
        ))}
      </div>
    </div>
  )
}

export default ReceitaSemanalSkeleton
