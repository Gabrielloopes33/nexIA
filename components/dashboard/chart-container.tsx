'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Configuração de cores para gráficos
 */
export interface ChartConfig {
  /** Cores para séries de dados */
  colors?: string[]
  /** Labels para séries */
  labels?: Record<string, string>
  /** Unidade de valores (ex: 'R$', '%') */
  valueUnit?: string
  /** Formato de valores */
  valueFormatter?: (value: number) => string
}

/**
 * Props do ChartContainer
 */
export interface ChartContainerProps {
  children: ReactNode
  /** Altura do container (padrão: 300) */
  height?: number
  /** Configurações do gráfico */
  config?: ChartConfig
  /** Classes adicionais */
  className?: string
  /** Se true, remove padding interno */
  noPadding?: boolean
}

// Cores padrão do tema
const DEFAULT_COLORS = [
  '#8B7DB8', // Primary
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
]

/**
 * ChartContainer - Wrapper padronizado para gráficos Recharts
 * 
 * Features:
 * - Altura configurável
 * - Configuração de cores consistente
 * - Responsivo por padrão
 * - Padding configurável
 * 
 * @example
 * ```tsx
 * <ChartContainer height={250} config={{ colors: ['#8B7DB8'] }}>
 *   <ResponsiveContainer width="100%" height="100%">
 *     <BarChart data={data}>
 *       <Bar dataKey="value" fill="#8B7DB8" />
 *     </BarChart>
 *   </ResponsiveContainer>
 * </ChartContainer>
 * ```
 */
export function ChartContainer({
  children,
  height = 300,
  config,
  className,
  noPadding = false,
}: ChartContainerProps) {
  const chartConfig: ChartConfig = {
    colors: DEFAULT_COLORS,
    ...config,
  }

  return (
    <div
      className={cn(
        'w-full',
        !noPadding && 'px-1',
        className
      )}
      style={{ height }}
    >
      {children}
    </div>
  )
}

/**
 * Legenda customizada para gráficos
 */
export interface ChartLegendProps {
  items: Array<{
    color: string
    label: string
    value?: string | number
  }>
  className?: string
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4 mt-4', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-slate-600">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-xs font-medium text-slate-900">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Tooltip padrão para gráficos
 */
export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
  valueFormatter?: (value: number) => string
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => String(v),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      {label && (
        <p className="mb-2 text-sm font-medium text-slate-900">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600">{entry.name}:</span>
            <span className="text-xs font-medium text-slate-900">
              {valueFormatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChartContainer
