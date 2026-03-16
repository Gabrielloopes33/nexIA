import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para o card de Motivos de Perda
 * 
 * Exibe uma representação visual de carregamento com
 * círculo e legenda simulando o gráfico de pizza.
 */
export function MotivosPerdaSkeleton() {
  return (
    <div className="flex items-center h-full" data-testid="motivos-perda-skeleton">
      <div className="flex-1 flex justify-center">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
      </div>
      <div className="w-32 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-8 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default MotivosPerdaSkeleton
