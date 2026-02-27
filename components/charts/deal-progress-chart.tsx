'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Mock data - 3 meses com 4 estágios cada
const data = [
  {
    mes: 'Jan 2024',
    primeiroemail: 45,
    contatofeito: 32,
    necessidade: 24,
    proposta: 15,
  },
  {
    mes: 'Fev 2024',
    primeiroemail: 52,
    contatofeito: 38,
    necessidade: 28,
    proposta: 18,
  },
  {
    mes: 'Mar 2024',
    primeiroemail: 58,
    contatofeito: 42,
    necessidade: 31,
    proposta: 22,
  },
]

export function DealProgressChart() {
  return (
    <Card className="rounded-sm border-2">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Progresso de Negócios</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Deals por estágio nos últimos 3 meses
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
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
            <Bar
              dataKey="primeiroemail"
              name="Primeiro Email"
              stackId="a"
              fill="#C4C4C4"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="contatofeito"
              name="Contato Feito"
              stackId="a"
              fill="#9795e4"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="necessidade"
              name="Necessidade"
              stackId="a"
              fill="#0070D2"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="proposta"
              name="Proposta"
              stackId="a"
              fill="#027E46"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
