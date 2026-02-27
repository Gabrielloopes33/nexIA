'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// Mock data - 2 categorias
const data = [
  { name: 'Concluído', value: 170, color: '#0070D2' },
  { name: 'A fazer', value: 82, color: '#059669' },
]

export function ActivitiesCompleteChart() {
  return (
    <Card className="rounded-sm border-2">
      <CardHeader className="p-4 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">Atividades Completas</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total de atividades concluídas vs pendentes
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 40,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} vertical={true} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '0.125rem',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 600 }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              label={{
                position: 'right',
                fontSize: 12,
                fontWeight: 600,
                fill: '#374151',
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
