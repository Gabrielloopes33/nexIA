import { cn } from '@/lib/utils'
import { Inbox, LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Props do DashboardEmpty
 */
export interface DashboardEmptyProps {
  /** Título/título da mensagem */
  title?: string
  /** Mensagem descritiva */
  message?: string
  /** Ícone customizado */
  icon?: LucideIcon
  /** Elemento customizado para ícone */
  customIcon?: ReactNode
  /** Ação opcional (botão, link, etc) */
  action?: ReactNode
  /** Classes adicionais */
  className?: string
  /** Tamanho do componente */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * DashboardEmpty - Estado vazio padronizado
 * 
 * Usado quando não há dados para exibir no dashboard
 * 
 * @example
 * ```tsx
 * if (data?.length === 0) {
 *   return (
 *     <DashboardEmpty
 *       title="Nenhum lead encontrado"
 *       message="Comece adicionando novos leads ao funil."
 *       action={<Button>Adicionar Lead</Button>}
 *     />
 *   )
 * }
 * ```
 */
export function DashboardEmpty({
  title = 'Nenhum dado disponível',
  message = 'Ainda não há dados para exibir neste período.',
  icon: Icon = Inbox,
  customIcon,
  action,
  className,
  size = 'md',
}: DashboardEmptyProps) {
  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'h-6 w-6',
      title: 'text-sm',
      message: 'text-xs',
    },
    md: {
      container: 'p-6',
      icon: 'h-10 w-10',
      title: 'text-base',
      message: 'text-sm',
    },
    lg: {
      container: 'p-8',
      icon: 'h-14 w-14',
      title: 'text-lg',
      message: 'text-base',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-lg border border-dashed border-slate-200 bg-slate-50/50',
        classes.container,
        className
      )}
    >
      {/* Icon */}
      <div className="mb-3 rounded-full bg-slate-100 p-3">
        {customIcon || (
          <Icon className={cn('text-slate-400', classes.icon)} />
        )}
      </div>

      {/* Title */}
      <h3 className={cn('font-medium text-slate-900', classes.title)}>
        {title}
      </h3>

      {/* Message */}
      <p className={cn('mt-1 text-slate-500 max-w-sm', classes.message)}>
        {message}
      </p>

      {/* Action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Estado vazio para cards específicos
 */
export interface DashboardEmptyCardProps extends Omit<DashboardEmptyProps, 'size'> {
  /** Se true, usa estilo compacto para cards */
  compact?: boolean
}

export function DashboardEmptyCard({
  compact = false,
  ...props
}: DashboardEmptyCardProps) {
  return (
    <DashboardEmpty
      {...props}
      size={compact ? 'sm' : 'md'}
    />
  )
}

export default DashboardEmpty
