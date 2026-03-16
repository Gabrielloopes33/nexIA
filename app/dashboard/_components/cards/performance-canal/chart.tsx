'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChannelPerformance } from '@/types/dashboard'

/**
 * Props do componente PerformanceCanalChart
 */
interface PerformanceCanalChartProps {
  /** Dados de performance dos canais */
  channels: ChannelPerformance[]
}

/**
 * Labels traduzidos para os canais
 */
const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP_OFFICIAL: 'WhatsApp Oficial',
  WHATSAPP_UNOFFICIAL: 'WhatsApp Não-oficial',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  EMAIL: 'Email',
  PHONE: 'Telefone',
  FORM: 'Formulário',
  MANUAL: 'Manual',
}

/**
 * Dados formatados para o gráfico
 */
interface ChartDataItem {
  name: string
  leads: number
  deals: number
  conversionRate: number
}

/**
 * Componente de gráfico de performance por canal
 * 
 * Renderiza um gráfico de barras comparando leads e deals
 * por canal de comunicação.
 * 
 * @param channels - Dados de performance dos canais
 */
export function PerformanceCanalChart({ channels }: PerformanceCanalChartProps) {
  // Formatar dados para o Recharts
  const chartData: ChartDataItem[] = channels.map((channel) => ({
    name: CHANNEL_LABELS[channel.channel] || channel.channel,
    leads: channel.leadsGenerated,
    deals: channel.dealsWon,
    conversionRate: Number(channel.conversionRate.toFixed(1)),
  }))

  return (
    <ResponsiveContainer 
      width="100%" 
      height="90%"
      data-testid="canais-chart"
    >
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10 }}
          interval={0}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: '#F1F5F9' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as ChartDataItem
              return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                  <p className="font-medium text-slate-900">{data.name}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium">Leads:</span> {data.leads}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Deals:</span> {data.deals}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Conversão:</span> {data.conversionRate}%
                    </p>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
        />
        <Bar 
          yAxisId="left" 
          dataKey="leads" 
          name="Leads" 
          fill="#46347F" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Bar 
          yAxisId="left" 
          dataKey="deals" 
          name="Deals" 
          fill="#8B5CF6" 
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default PerformanceCanalChart
