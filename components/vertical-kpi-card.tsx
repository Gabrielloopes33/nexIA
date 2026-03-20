/**
 * Vertical KPI Card Component - Cards Quadrados Compactos 1:1
 * Proporção quadrada com tamanho reduzido
 */

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerticalKpiCardProps {
  label: string
  value: string | number
  change?: string | number
  icon?: LucideIcon
  suffix?: string
  isNegativeGood?: boolean
}

export function VerticalKpiCard({
  label,
  value,
  change,
  icon: Icon,
  suffix = '',
  isNegativeGood = false,
}: VerticalKpiCardProps) {
  // Parse change value
  const changeString = String(change || '0%')
  const changeValue = parseFloat(changeString.replace(/[^-0-9.,]/g, '').replace(',', '.'))
  const isPositive = isNegativeGood ? changeValue < 0 : changeValue > 0
  const isNeutral = changeValue === 0

  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-2.5',
        'transition-colors hover:border-slate-300 w-[220px] h-[145px]'
      )}
    >
      {/* Top: Label e Icon */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider leading-tight line-clamp-2 flex-1">
          {label}
        </p>
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Center: Value */}
      <div className="flex items-center justify-center flex-1">
        <span className="text-xl font-bold text-slate-900">
          {value}{suffix}
        </span>
      </div>

      {/* Bottom: Change/Trend */}
      {change !== undefined && (
        <div
          className={cn(
            'flex items-center gap-0.5 text-[15px]',
            isNeutral && 'text-slate-500',
            !isNeutral && isPositive && 'text-emerald-600',
            !isNeutral && !isPositive && 'text-red-600'
          )}
        >
          {!isNeutral && isPositive && <TrendingUp className="h-3 w-3" />}
          {!isNeutral && !isPositive && <TrendingDown className="h-3 w-3" />}
          <span className="font-semibold">
            {changeString.startsWith('+') || changeString.startsWith('-') 
              ? changeString 
              : `${isPositive ? '+' : ''}${changeString}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default VerticalKpiCard
