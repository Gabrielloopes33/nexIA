import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react'

/**
 * Props do KpiVerticalItem
 */
export interface KpiVerticalItemProps {
  /** Label do KPI */
  label: string
  /** Valor formatado */
  value: string | number
  /** Variação percentual (ex: "+12%", "-5%") */
  change?: string
  /** Quando true, valores negativos são verdes (ex: custo reduzido) */
  isNegativeGood?: boolean
  /** Ícone opcional */
  icon?: LucideIcon
  /** Estado de loading */
  loading?: boolean
  /** Classes adicionais */
  className?: string
  /** Callback ao clicar */
  onClick?: () => void
}

/**
 * KpiVerticalItem - Item de KPI para sidebar vertical
 * 
 * Design compacto para colunas de 160px
 * Cards reduzidos (~100px altura) para alinhar com cards do meio
 * Mostra label, valor, ícone e variação
 * 
 * @example
 * ```tsx
 * <KpiVerticalItem
 *   label="Receita"
 *   value="R$ 45.230"
 *   change="+12%"
 *   icon={TrendingUp}
 * />
 * ```
 */
export function KpiVerticalItem({
  label,
  value,
  change,
  isNegativeGood = false,
  icon: Icon,
  loading = false,
  className,
  onClick,
}: KpiVerticalItemProps) {
  // Estado de loading
  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center justify-center min-h-[145px] h-[145px]',
        className
      )}>
        <Skeleton className="h-3 w-[100px] mb-3" />
        <Skeleton className="h-8 w-[120px] mb-2" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
    )
  }

  // Parse change para determinar cor
  const changeValue = change ? parseFloat(change.replace(/[^0-9.-]/g, '')) : 0
  const isPositive = changeValue >= 0
  
  // Determina cor da variação
  const changeColor = isNegativeGood
    ? isPositive
      ? 'text-red-500'
      : 'text-emerald-500'
    : isPositive
      ? 'text-emerald-500'
      : 'text-red-500'

  const ChangeIcon = isPositive ? ArrowUp : ArrowDown

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 h-[145px]',
        'flex flex-col items-center justify-center text-center',
        'min-h-[145px]',
        'transition-colors hover:border-slate-300',
        onClick && 'cursor-pointer hover:bg-slate-50',
        className
      )}
      onClick={onClick}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-3 p-2 rounded-lg bg-slate-50">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
      )}
      
      {/* Label */}
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider text-center leading-tight">
        {label}
      </p>
      
      {/* Value */}
      <span className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </span>
      
      {/* Change */}
      {change && (
        <div className={cn('mt-1 flex items-center gap-0.5 text-sm', changeColor)}>
          <ChangeIcon className="h-3.5 w-3.5" />
          <span className="font-semibold">{change}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Lista de KPIs verticais
 */
export interface KpiVerticalListProps {
  children: React.ReactNode
  className?: string
}

export function KpiVerticalList({ children, className }: KpiVerticalListProps) {
  return (
    <div className={cn('flex flex-col gap-3 h-full', className)}>
      {children}
    </div>
  )
}

export default KpiVerticalItem
