'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { FunnelMetrics, FunnelStage } from '@/types/dashboard'

/**
 * Props do componente FunilPorEtapaChart
 */
interface FunilPorEtapaChartProps {
  /** Dados do funil */
  data: FunnelMetrics
}

/**
 * Dados formatados para o gráfico
 */
interface ChartDataItem {
  name: string
  count: number
  value: number
  conversionRate: number
  avgTime: number
  fill: string
}

/**
 * Cores para as barras do gráfico
 */
const COLORS = ['#46347F', '#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']

/**
 * Componente de gráfico de funil por etapa
 * 
 * Renderiza um gráfico de barras horizontais mostrando a distribuição
 * de leads por etapa do funil.
 * 
 * @param data - Dados do funil de vendas
 */
export function FunilPorEtapaChart({ data }: FunilPorEtapaChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Formatar dados para o Recharts
  const chartData: ChartDataItem[] = data.stages.map((stage, index) => ({
    name: stage.stageName,
    count: stage.count,
    value: stage.value,
    conversionRate: stage.conversionRate,
    avgTime: stage.avgTimeHours,
    fill: stage.color || COLORS[index % COLORS.length],
  }))

  if (!mounted) return <div className="h-full" data-testid="funil-chart" />

  return (
    <div className="h-full" data-testid="funil-chart">
      {/* Header com totais */}
      <div className="flex justify-between text-sm text-muted-foreground mb-4">
        <span>Total: {data.totalLeads} leads</span>
        <span>Valor: R$ {data.totalValue.toLocaleString('pt-BR')}</span>
      </div>
      
      {/* Gráfico */}
      <ResponsiveContainer width="100%" height="85%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis 
            type="number" 
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={75}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: '#F1F5F9' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ChartDataItem
                return (
                  <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-slate-600">
                        <span className="font-medium">Leads:</span> {item.count}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Valor:</span> R$ {item.value.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Conversão:</span> {item.conversionRate.toFixed(1)}%
                      </p>
                      {item.avgTime > 0 && (
                        <p className="text-slate-600">
                          <span className="font-medium">Tempo médio:</span> {item.avgTime}h
                        </p>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={40}
            isAnimationActive={false}
            minPointSize={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FunilPorEtapaChart
