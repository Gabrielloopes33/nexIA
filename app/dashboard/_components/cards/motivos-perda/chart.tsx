'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LostReasonTrend } from '@/types/dashboard'

interface MotivosPerdaChartProps {
  data: LostReasonTrend[]
}

const REASON_LABELS: Record<string, string> = {
  NO_BUDGET: 'Sem Budget',
  NO_INTEREST: 'Sem Interesse',
  COMPETITOR: 'Concorrência',
  NO_RESPONSE: 'Sem Resposta',
  TIMING: 'Timing',
  OTHER: 'Outro',
  PRICE: 'Preço',
  PRODUCT: 'Produto',
  SERVICE: 'Atendimento',
}

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#64748B', '#8B5CF6', '#EC4899']

/**
 * Chart de Motivos de Perda
 * 
 * Exibe um gráfico de donut com os motivos de perda
 * e uma legenda com as principais categorias.
 */
export function MotivosPerdaChart({ data }: MotivosPerdaChartProps) {
  const chartData = data.map((item) => ({
    name: REASON_LABELS[item.reason] || item.reason,
    value: item.count,
    percentage: item.percentage || (item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100,
    trend: item.change || 0,
    rawReason: item.reason,
  }))

  // Ordenar por quantidade (maior primeiro)
  const sortedData = [...chartData].sort((a, b) => b.value - a.value)

  return (
    <div className="flex items-center h-full" data-testid="motivos-perda-chart">
      <div className="flex-1 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg text-sm">
                      <p className="font-medium">{data.name}</p>
                      <p>Quantidade: {data.value}</p>
                      <p>Porcentagem: {data.percentage.toFixed(1)}%</p>
                      <p className={data.trend > 0 ? 'text-red-500' : data.trend < 0 ? 'text-green-500' : 'text-gray-500'}>
                        Trend: {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)}%
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legenda com top 4 motivos */}
      <div className="w-32 space-y-2">
        {sortedData.slice(0, 4).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-xs" data-testid="motivo-legend-item">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="truncate flex-1">{item.name}</span>
            <span className="font-medium">{item.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MotivosPerdaChart
