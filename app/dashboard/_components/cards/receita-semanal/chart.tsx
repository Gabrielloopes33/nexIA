'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { WeeklyRevenue } from '@/types/dashboard'

interface ReceitaSemanalChartProps {
  data: WeeklyRevenue[]
}

/**
 * Chart de Receita Semanal
 * 
 * Exibe um gráfico de linha com:
 * - Receita realizada (linha sólida roxa)
 * - Meta de receita (linha tracejada cinza)
 * - Linha de média como referência
 * - Tooltip detalhado com deals
 */
export function ReceitaSemanalChart({ data }: ReceitaSemanalChartProps) {
  const chartData = data.map((week) => ({
    week: week.week.split('-W')[1] || week.week, // Mostrar só o número da semana
    revenue: week.revenue,
    target: week.goal,
    deals: week.dealsWon,
    ticketAvg: week.ticketAvg,
  }))

  const avgRevenue = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length 
    : 0

  return (
    <ResponsiveContainer width="100%" height="85%" data-testid="receita-semanal-chart">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week" 
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `S${value}`}
        />
        <YAxis 
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const revenueValue = payload.find(p => p.dataKey === 'revenue')?.value as number | undefined
              const targetValue = payload.find(p => p.dataKey === 'target')?.value as number | undefined
              const deals = payload[0]?.payload?.deals as number | undefined
              
              return (
                <div className="bg-white p-3 border rounded shadow-lg text-sm">
                  <p className="font-medium">Semana {label}</p>
                  <p className="text-[#46347F]">
                    Realizado: R$ {revenueValue?.toLocaleString()}
                  </p>
                  <p className="text-slate-400">
                    Meta: R$ {targetValue?.toLocaleString()}
                  </p>
                  {deals !== undefined && (
                    <p className="text-muted-foreground">
                      Deals: {deals}
                    </p>
                  )}
                </div>
              )
            }
            return null
          }}
        />
        <ReferenceLine y={avgRevenue} stroke="#E2E8F0" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#46347F"
          strokeWidth={2}
          dot={{ fill: '#46347F', r: 4 }}
          activeDot={{ r: 6 }}
          name="Receita"
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#94A3B8"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Meta"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ReceitaSemanalChart
