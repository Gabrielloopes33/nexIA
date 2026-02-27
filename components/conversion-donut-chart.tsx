/**
 * Conversion Donut Chart Component
 * Displays conversion funnel stages as a donut chart using Recharts
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { CONVERSION_STAGES } from '@/lib/mock-charts-data'
import { TrendingUp } from 'lucide-react'

export function ConversionDonutChart() {
  // Custom label for the center of donut
  const renderCenterLabel = () => {
    const totalLeads = CONVERSION_STAGES[0]?.value || 0
    const converted = CONVERSION_STAGES[CONVERSION_STAGES.length - 1]?.value || 0
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0

    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
      >
        <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
          {conversionRate}%
        </tspan>
        <tspan x="50%" dy="1.5em" className="text-xs fill-muted-foreground">
          Taxa Conversão
        </tspan>
      </text>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-sm border-2 border-border bg-background p-3 shadow-lg">
          <p className="mb-1 text-sm font-semibold text-foreground">{data.stage}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{data.value}</span> leads
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{data.percentage}%</span> do
            total
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-3 pt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="rounded-sm border-2 border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            Funil de Conversão
          </CardTitle>
          <div className="flex items-center gap-2 rounded-sm bg-[#027E46]/10 px-2 py-1">
            <TrendingUp className="h-3 w-3 text-[#027E46]" />
            <span className="text-xs font-semibold text-[#027E46]">+8.5%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={CONVERSION_STAGES}
              dataKey="value"
              nameKey="stage"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              label={false}
            >
              {CONVERSION_STAGES.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t-2 border-border pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-lg font-bold text-foreground">
              {CONVERSION_STAGES[0]?.value || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Em Proposta</p>
            <p className="text-lg font-bold text-foreground">
              {CONVERSION_STAGES[3]?.value || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Fechados</p>
            <p className="text-lg font-bold text-[#027E46]">
              {CONVERSION_STAGES[4]?.value || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
