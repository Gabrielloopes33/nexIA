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
}

export function VerticalKpiCard({
  label,
  value,
  change,
  icon: Icon,
  suffix = '',
  isNegativeGood = false,
}: VerticalKpiCardProps) {
  // Determina se a mudança é positiva ou negativa
  const changeString = String(change || '0%')
  const changeValue = parseFloat(changeString.replace(/[^-0-9.]/g, ''))
  const isPositive = isNegativeGood ? changeValue < 0 : changeValue > 0

  return (
    <Card className="group rounded-sm border-2 border-border p-4 transition-all hover:border-[#9795e4]">
      {/* Icon e Change Badge no topo */}
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-gradient-to-br from-[#9795e4] to-[#b3b3e5] p-2 rounded-sm">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div
          className={cn(
            'rounded-sm px-2 py-0.5 text-[10px] font-semibold',
            isPositive
              ? 'bg-[#027E46]/10 text-[#027E46]'
              : 'bg-[#C23934]/10 text-[#C23934]'
          )}
        >
          {changeString}
        </div>
      </div>

      {/* Label */}
      <h3 className="mb-2 text-sm font-medium text-muted-foreground leading-tight">{label}</h3>

      {/* Value em destaque */}
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {suffix && (
          <span className="text-base font-medium text-muted-foreground">{suffix}</span>
        )}
      </div>

      {/* Progress Indicator sutil */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
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
