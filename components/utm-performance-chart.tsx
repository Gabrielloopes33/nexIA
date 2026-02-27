/**
 * UTM Performance Chart Component
 * Displays UTM source performance with horizontal bars using Recharts
 */

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
import { UTM_SOURCES } from '@/lib/mock-charts-data'
import { Target } from 'lucide-react'

export function UTMPerformanceChart() {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-sm shadow-sm bg-background p-3">
          <p className="mb-2 text-sm font-semibold text-foreground">{data.source}</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Leads: <span className="font-semibold text-foreground">{data.leads}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Conversões:{' '}
              <span className="font-semibold text-foreground">{data.conversions}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              ROI: <span className="font-semibold text-foreground">{data.roi}x</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate best performer
  const bestPerformer = UTM_SOURCES.reduce((prev, current) =>
    current.roi > prev.roi ? current : prev
  )

  return (
    <Card className="rounded-sm shadow-sm">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            Performance por Canal (UTM)
          </CardTitle>
          <div className="flex items-center gap-2 rounded-sm bg-[#0070D2]/10 px-2 py-1">
            <Target className="h-3 w-3 text-[#0070D2]" />
            <span className="text-xs font-semibold text-[#0070D2]">
              {bestPerformer.source}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={UTM_SOURCES}
            layout="vertical"
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#DDDBDA" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#706E6B' }} />
            <YAxis
              type="category"
              dataKey="source"
              tick={{ fontSize: 12, fill: '#706E6B' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(151, 149, 228, 0.1)' }} />
            <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
              {UTM_SOURCES.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-lg font-bold text-foreground">
              {UTM_SOURCES.reduce((sum, s) => sum + s.leads, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Conversões</p>
            <p className="text-lg font-bold text-foreground">
              {UTM_SOURCES.reduce((sum, s) => sum + s.conversions, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ROI Médio</p>
            <p className="text-lg font-bold text-[#027E46]">
              {(
                UTM_SOURCES.reduce((sum, s) => sum + s.roi, 0) / UTM_SOURCES.length
              ).toFixed(1)}
              x
            </p>
          </div>
        </div>

        {/* Best Performer Highlight */}
        <div className="mt-3 rounded-sm bg-gradient-to-r from-[#9795e4]/10 to-transparent p-3">
          <p className="text-xs text-muted-foreground">
            🏆 <span className="font-semibold text-foreground">{bestPerformer.source}</span>{' '}
            é o melhor canal com ROI de{' '}
            <span className="font-semibold text-[#027E46]">{bestPerformer.roi}x</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
