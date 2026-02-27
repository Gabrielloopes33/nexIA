/**
 * Advanced KPIs Component
 * Métricas avançadas: Pipeline Total, Ticket Médio, Tempo de Conversão, Lead Score Médio
 * Design corporativo com gradiente purple e formatação BR
 */

import { TrendingUp, DollarSign, Clock, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDuration, formatChange } from '@/lib/formatters'
import { ENRICHED_LEADS } from '@/lib/mock-leads-enriched'

export function AdvancedKpis() {
  // Calcula métricas reais dos leads enriquecidos
  const activeLeads = ENRICHED_LEADS.filter(l => l.status === 'ativo')
  const convertedLeads = ENRICHED_LEADS.filter(l => (l.receita && l.receita > 0))
  
  // Pipeline Total (soma de receita de deals ativos/convertidos)
  const pipelineTotal = ENRICHED_LEADS
    .filter(l => l.receita && l.receita > 0)
    .reduce((sum, l) => sum + (l.receita || 0), 0)
  
  // Ticket Médio dos deals fechados
  const dealsWithRevenue = convertedLeads.filter(l => l.receita && l.receita > 0)
  const averageTicket = dealsWithRevenue.length > 0
    ? dealsWithRevenue.reduce((sum, l) => sum + (l.receita || 0), 0) / dealsWithRevenue.length
    : 0
  
  // Tempo de Conversão Médio (dias entre criação e último contato para convertidos)
  const conversionTimes = convertedLeads
    .filter(l => l.criadoEm && l.atualizadoEm)
    .map(l => {
      const created = new Date(l.criadoEm!).getTime()
      const updated = new Date(l.atualizadoEm!).getTime()
      return Math.floor((updated - created) / (1000 * 60 * 60 * 24))
    })
  
  const averageConversionTime = conversionTimes.length > 0
    ? Math.round(conversionTimes.reduce((sum, days) => sum + days, 0) / conversionTimes.length)
    : 0
  
  // Lead Score Médio
  const leadsWithScore = ENRICHED_LEADS.filter(l => l.leadScore !== undefined)
  const averageLeadScore = leadsWithScore.length > 0
    ? Math.round(leadsWithScore.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leadsWithScore.length)
    : 0

  const kpis = [
    {
      label: 'Pipeline Total',
      value: formatCurrency(pipelineTotal),
      change: formatChange(15.8),
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(averageTicket),
      change: formatChange(8.2),
      icon: DollarSign,
      iconBg: 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
    },
    {
      label: 'Tempo de Conversão',
      value: formatDuration(averageConversionTime, 'days'),
      change: formatChange(-12.5), // Negativo é bom (menos tempo)
      icon: Clock,
      iconBg: 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
    },
    {
      label: 'Lead Score Médio',
      value: averageLeadScore.toString(),
      change: formatChange(5.3),
      icon: Target,
      iconBg: 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]',
      suffix: ' / 100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        const isNegativeGood = kpi.label === 'Tempo de Conversão'
        
        return (
          <Card 
            key={index}
            className="p-4 rounded-sm shadow-sm transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">
                  {kpi.label}
                </p>
              </div>
              <div className={`${kpi.iconBg} p-2 rounded-sm`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold tracking-tight">
                  {kpi.value}
                </p>
                {kpi.suffix && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {kpi.suffix}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                <span 
                  className={`text-xs font-medium ${
                    isNegativeGood
                      ? kpi.change.trend === 'down' 
                        ? 'text-green-600' 
                        : kpi.change.trend === 'up'
                        ? 'text-red-600'
                        : 'text-gray-600'
                      : kpi.change.trend === 'up'
                      ? 'text-green-600'
                      : kpi.change.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {kpi.change.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs. mês anterior
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
