'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/dashboard/chart-container'
import type { FunilPorEtapaData, FunilEtapa } from '@/types/dashboard'
import { formatCurrency } from '@/lib/formatters'

/**
 * Props do FunilPorEtapaChart
 */
export interface FunilPorEtapaChartProps {
  data: FunilPorEtapaData
}

/**
 * FunilPorEtapaChart - Gráfico de barras horizontais do funil
 * 
 * Exibe a distribuição de leads por etapa do funil
 * com barras coloridas por etapa.
 */
export function FunilPorEtapaChart({ data }: FunilPorEtapaChartProps) {
  // Prepara dados para o gráfico
  const chartData = data.etapas.map((etapa) => ({
    ...etapa,
    // Para exibição formatada no tooltip
    valorFormatado: formatCurrency(etapa.valor),
  }))

  return (
    <ChartContainer height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            hide 
          />
          <YAxis
            type="category"
            dataKey="nome"
            width={100}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const etapa = payload[0].payload as FunilEtapa & { valorFormatado: string }
              
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="font-medium text-slate-900">{etapa.nome}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Quantidade:</span>
                      <span className="font-medium">{etapa.quantidade}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">Valor:</span>
                      <span className="font-medium">{etapa.valorFormatado}</span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Bar
            dataKey="quantidade"
            radius={[0, 4, 4, 0]}
            barSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.cor || '#8B7DB8'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

/**
 * Versão simplificada com barras empilhadas
 */
export function FunilPorEtapaStackedChart({ data }: FunilPorEtapaChartProps) {
  const total = data.totalLeads || 1

  return (
    <div className="space-y-2">
      {/* Barra empilhada visual */}
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {data.etapas.map((etapa, index) => {
          const percentage = (etapa.quantidade / total) * 100
          return (
            <div
              key={etapa.id}
              style={{
                width: `${percentage}%`,
                backgroundColor: etapa.cor || '#8B7DB8',
              }}
              className="first:rounded-l-full last:rounded-r-full transition-all hover:opacity-80"
              title={`${etapa.nome}: ${etapa.quantidade} (${percentage.toFixed(1)}%)`}
            />
          )
        })}
      </div>

      {/* Legenda compacta */}
      <div className="flex flex-wrap gap-3 text-xs">
        {data.etapas.slice(0, 4).map((etapa) => (
          <div key={etapa.id} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: etapa.cor || '#8B7DB8' }}
            />
            <span className="text-slate-600">
              {etapa.nome}: {etapa.quantidade}
            </span>
          </div>
        ))}
        {data.etapas.length > 4 && (
          <span className="text-slate-400">
            +{data.etapas.length - 4} mais
          </span>
        )}
      </div>
    </div>
  )
}

export default FunilPorEtapaChart
