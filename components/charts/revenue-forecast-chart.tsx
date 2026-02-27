'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Mock data - 6 meses com valores em aberto e ganhos
const data = [
  { mes: 'Out', aberto: 145000, ganho: 98000 },
  { mes: 'Nov', aberto: 168000, ganho: 112000 },
  { mes: 'Dez', aberto: 192000, ganho: 135000 },
  { mes: 'Jan', aberto: 215000, ganho: 158000 },
  { mes: 'Fev', aberto: 238000, ganho: 178000 },
  { mes: 'Mar', aberto: 265000, ganho: 198000 },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function RevenueForecastChart() {
  return (
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">Previsão de Receita</CardTitle>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Evolução de receitas em aberto e realizadas
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorAberto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0070D2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0070D2" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorGanho" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#027E46" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#027E46" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '0.125rem',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="square"
            />
            <Area
              type="monotone"
              dataKey="aberto"
              name="Em Aberto"
              stroke="#0070D2"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAberto)"
            />
            <Area
              type="monotone"
              dataKey="ganho"
              name="Ganho"
              stroke="#027E46"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGanho)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
