import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Props do DashboardError
 */
export interface DashboardErrorProps {
  /** Título do erro */
  title?: string
  /** Mensagem de erro */
  message?: string
  /** Erro original (para logging) */
  error?: Error | null
  /** Callback para retry */
  onRetry?: () => void
  /** Ícone customizado */
  icon?: ReactNode
  /** Classes adicionais */
  className?: string
  /** Tamanho do componente */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * DashboardError - Estado de erro padronizado
 * 
 * Usado quando ocorre um erro ao carregar dados do dashboard
 * 
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <DashboardError
 *       error={error}
 *       onRetry={refetch}
 *     />
 *   )
 * }
 * ```
 */
export function DashboardError({
  title = 'Erro ao carregar dados',
  message = 'Não foi possível carregar os dados do dashboard.',
  error,
  onRetry,
  icon,
  className,
  size = 'md',
}: DashboardErrorProps) {
  // Log error para debugging
  if (error) {
    console.error('[DashboardError]', error)
  }

  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'h-8 w-8',
      title: 'text-sm',
      message: 'text-xs',
    },
    md: {
      container: 'p-6',
      icon: 'h-12 w-12',
      title: 'text-base',
      message: 'text-sm',
    },
    lg: {
      container: 'p-8',
      icon: 'h-16 w-16',
      title: 'text-lg',
      message: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-lg border border-red-200 bg-red-50/50',
        classes.container,
        className
      )}
    >
      {/* Icon */}
      <div className="mb-3 rounded-full bg-red-100 p-2">
        {icon || (
          <AlertCircle className={cn('text-red-500', classes.icon)} />
        )}
      </div>

      {/* Title */}
      <h3 className={cn('font-semibold text-red-950', classes.title)}>
        {title}
      </h3>

      {/* Message */}
      <p className={cn('mt-1 text-red-800 max-w-md', classes.message)}>
        {error?.message || message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          onClick={onRetry}
          className="mt-4 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

/**
 * Estado de erro inline (para cards)
 */
export interface DashboardErrorInlineProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function DashboardErrorInline({
  message = 'Erro ao carregar',
  onRetry,
  className,
}: DashboardErrorInlineProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md',
        'bg-red-50 px-3 py-2 text-sm text-red-600',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-700 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default DashboardError
