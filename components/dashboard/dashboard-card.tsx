import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Props do DashboardCard
 */
export interface DashboardCardProps {
  /** Título do card */
  title: string
  /** Descrição opcional */
  description?: string
  /** Conteúdo do card */
  children: ReactNode
  /** Classes CSS adicionais */
  className?: string
  /** Ação no header (botão, menu, etc) */
  action?: ReactNode
  /** Estado de loading - mostra skeleton */
  loading?: boolean
  /** Erro - mostra estado de erro */
  error?: Error | null
  /** Callback para retry */
  onRetry?: () => void
  /** Estado vazio - mostra mensagem vazia */
  empty?: boolean
  /** Mensagem personalizada para estado vazio */
  emptyMessage?: string
  /** Ícone para estado vazio */
  emptyIcon?: ReactNode
  /** Altura mínima do card */
  minHeight?: number | string
}

/**
 * DashboardCard - Container padronizado para cards do dashboard
 * 
 * Features:
 * - Header com título e descrição padronizados
 * - Estado de loading com skeleton
 * - Estado de erro com botão de retry
 * - Estado vazio customizável
 * - Layout consistente
 * 
 * @example
 * ```tsx
 * <DashboardCard
 *   title="Funil de Vendas"
 *   description="Distribuição por etapa"
 *   loading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   empty={data?.length === 0}
 *   emptyMessage="Nenhum dado disponível"
 * >
 *   {data && <Chart data={data} />}
 * </DashboardCard>
 * ```
 */
export function DashboardCard({
  title,
  description,
  children,
  className,
  action,
  loading = false,
  error = null,
  onRetry,
  empty = false,
  emptyMessage = 'Nenhum dado disponível',
  emptyIcon,
  minHeight = 200,
}: DashboardCardProps) {
  // Estado de loading
  if (loading) {
    return (
      <Card 
        className={cn('overflow-hidden', className)}
        style={{ minHeight }}
      >
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-[150px]" />
          {description && <Skeleton className="h-4 w-[200px] mt-1" />}
        </CardHeader>
        <CardContent>
          <DashboardCardSkeleton />
        </CardContent>
      </Card>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <Card 
        className={cn('overflow-hidden border-red-200 bg-red-50/50', className)}
        style={{ minHeight }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-red-600 mb-3">
              {error.message || 'Erro ao carregar dados'}
            </p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado vazio
  if (empty) {
    return (
      <Card 
        className={cn('overflow-hidden', className)}
        style={{ minHeight }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            {emptyIcon || <AlertCircle className="h-8 w-8 mb-2 opacity-50" />}
            <p className="text-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado normal
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-0.5">
                {description}
              </CardDescription>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton padrão para cards
 */
function DashboardCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[75%]" />
      <div className="pt-2">
        <Skeleton className="h-[120px] w-full rounded-md" />
      </div>
    </div>
  )
}

export default DashboardCard
