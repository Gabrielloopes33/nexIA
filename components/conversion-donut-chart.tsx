/**
 * Conversion Donut Chart Component
 * Displays conversion funnel stages as a donut chart using Recharts
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useContacts } from '@/hooks/use-contacts'
import { TrendingUp } from 'lucide-react'
import { useOrganizationId } from '@/lib/contexts/organization-context'

// Cores para os estágios do funil
const STAGE_COLORS = {
  new: '#0070D2',      // Azul Salesforce
  contacted: '#00A1E0', // Azul claro
  qualified: '#F5A623', // Laranja
  proposal: '#8B7DB8',  // Roxo
  closed: '#027E46',    // Verde
}

interface ConversionStage {
  stage: string
  value: number
  percentage: number
  color: string
}

export function ConversionDonutChart() {
  const organizationId = useOrganizationId() ?? ''
  const { contacts, isLoading } = useContacts(organizationId)

  // Calcula estágios de conversão a partir dos contatos reais
  const conversionStages: ConversionStage[] = useMemo(() => {
    if (!contacts || contacts.length === 0) {
      // Fallback: dados vazios quando não há contatos
      return [
        { stage: 'Novos', value: 0, percentage: 0, color: STAGE_COLORS.new },
        { stage: 'Contatados', value: 0, percentage: 0, color: STAGE_COLORS.contacted },
        { stage: 'Qualificados', value: 0, percentage: 0, color: STAGE_COLORS.qualified },
        { stage: 'Em Proposta', value: 0, percentage: 0, color: STAGE_COLORS.proposal },
        { stage: 'Fechados', value: 0, percentage: 0, color: STAGE_COLORS.closed },
      ]
    }

    const total = contacts.length
    
    // Conta contatos por status (mapeando status para estágios do funil)
    const newLeads = contacts.filter(c => c.status === 'ACTIVE' && (!c._count?.conversations || c._count.conversations === 0)).length
    const contacted = contacts.filter(c => c._count?.conversations && c._count.conversations > 0).length
    const qualified = contacts.filter(c => c.leadScore >= 70).length
    const proposal = contacts.filter(c => c._count?.deals && c._count.deals > 0).length
    const closed = contacts.filter(c => c.metadata?.converted === true || c.metadata?.dealValue as number > 0).length

    return [
      { 
        stage: 'Novos', 
        value: newLeads, 
        percentage: total > 0 ? Math.round((newLeads / total) * 100) : 0, 
        color: STAGE_COLORS.new 
      },
      { 
        stage: 'Contatados', 
        value: contacted, 
        percentage: total > 0 ? Math.round((contacted / total) * 100) : 0, 
        color: STAGE_COLORS.contacted 
      },
      { 
        stage: 'Qualificados', 
        value: qualified, 
        percentage: total > 0 ? Math.round((qualified / total) * 100) : 0, 
        color: STAGE_COLORS.qualified 
      },
      { 
        stage: 'Em Proposta', 
        value: proposal, 
        percentage: total > 0 ? Math.round((proposal / total) * 100) : 0, 
        color: STAGE_COLORS.proposal 
      },
      { 
        stage: 'Fechados', 
        value: closed, 
        percentage: total > 0 ? Math.round((closed / total) * 100) : 0, 
        color: STAGE_COLORS.closed 
      },
    ]
  }, [contacts])

  // Custom label for the center of donut
  const renderCenterLabel = () => {
    const totalLeads = conversionStages[0]?.value || 0
    const converted = conversionStages[conversionStages.length - 1]?.value || 0
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
        <div className="rounded-sm shadow-sm bg-background p-3">
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

  if (isLoading) {
    return (
      <Card className="rounded-sm shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg font-bold">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-sm shadow-sm">
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
              data={conversionStages}
              dataKey="value"
              nameKey="stage"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              label={false}
            >
              {conversionStages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-lg font-bold text-foreground">
              {conversionStages[0]?.value || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Em Proposta</p>
            <p className="text-lg font-bold text-foreground">
              {conversionStages[3]?.value || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Fechados</p>
            <p className="text-lg font-bold text-[#027E46]">
              {conversionStages[4]?.value || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
