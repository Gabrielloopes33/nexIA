import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Recuperação de Perdidos
 * 
 * Exibe uma representação visual de carregamento com cards
 * simulando os leads perdidos.
 */
export function RecuperacaoPerdidosSkeleton() {
  return (
    <div className="space-y-3" data-testid="recuperacao-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="p-3 rounded-lg border border-slate-200 space-y-2"
        >
          {/* Header skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
          </div>
          
          {/* Contact skeleton */}
          <Skeleton className="h-3 w-24" />
          
          {/* Footer skeleton */}
          <div className="flex justify-between pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecuperacaoPerdidosSkeleton
