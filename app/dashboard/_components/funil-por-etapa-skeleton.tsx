import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton específico para o card FunilPorEtapa
 * 
 * Simula a estrutura visual do gráfico de barras horizontais
 * com diferentes larguras para criar efeito de barras decrescentes.
 */
export function FunilPorEtapaSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {/* Simula 5 barras do gráfico com larguras decrescentes */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-[90%]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-[75%]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-[60%]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-[40%]" />
      </div>
    </div>
  )
}

/**
 * Skeleton compacto para listas ou previews
 */
export function FunilPorEtapaSkeletonCompact() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-[80%]" />
      <Skeleton className="h-3 w-[60%]" />
    </div>
  )
}

/**
 * Skeleton para a versão empilhada
 */
export function FunilPorEtapaStackedSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full rounded-full" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export default FunilPorEtapaSkeleton
