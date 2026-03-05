/**
 * Vertical KPI Card Component - Estilo Salesforce
 * Valor grande em destaque, igual ao 18B, 267, 7.8B
 */

import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VerticalKpiCardProps {
  label: string
  value: string
  change: string
  icon: LucideIcon
  suffix?: string
  isNegativeGood?: boolean
  size?: 'default' | 'large'
}

export function VerticalKpiCard({
  label,
  value,
  change,
  icon: Icon,
  suffix = '',
  isNegativeGood = false,
  size = 'default',
}: VerticalKpiCardProps) {
  // Determina se a mudança é positiva ou negativa
  const changeString = String(change || '0%')
  const changeValue = parseFloat(changeString.replace(/[^-0-9.]/g, ''))
  const isPositive = isNegativeGood ? changeValue < 0 : changeValue > 0

  return (
    <Card className="group rounded-sm shadow-sm p-2.5 transition-all hover:shadow-md">
      {/* Icon e Change Badge no topo */}
      <div className="mb-2 flex items-center justify-between">
        <div className="bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] p-1.5 rounded-sm">
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div
          className={cn(
            'rounded-sm px-1.5 py-0 text-[10px] font-bold',
            isPositive
              ? 'bg-[#027E46]/10 text-[#027E46]'
              : 'bg-[#C23934]/10 text-[#C23934]'
          )}
        >
          {changeString}
        </div>
      </div>

      {/* Label */}
      <h3 className="mb-1 text-xs font-medium text-gray-500 leading-tight">{label}</h3>

      {/* Value em destaque - fonte responsiva */}
      <div className="flex items-baseline gap-1 min-w-0">
        <p className={cn(
          "font-bold text-gray-900 tracking-tight truncate",
          size === 'large' ? 'text-2xl' : 'text-lg'
        )}>{value}</p>
        {suffix && (
          <span className="text-sm font-semibold text-gray-500 flex-shrink-0">{suffix}</span>
        )}
      </div>

      {/* Progress Indicator sutil */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500',
            isPositive
              ? 'bg-gradient-to-r from-[#9795e4] to-[#b3b3e5]'
              : 'bg-gradient-to-r from-[#C23934] to-[#C23934]/70'
          )}
          style={{ width: `${Math.min(Math.abs(changeValue) * 5, 100)}%` }}
        />
      </div>
    </Card>
  )
}
