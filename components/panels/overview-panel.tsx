'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, Bell, Target, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIInsight, InsightType } from '@/lib/types/ai-insights'
import { MOCK_AI_INSIGHTS } from '@/lib/mock-ai-insights'

const INSIGHT_TYPES = [
  {
    type: 'previsoes' as InsightType,
    label: 'PREVISÕES',
    icon: BarChart3,
    color: 'text-[#027E46]',
    bgColor: 'bg-[#027E46]/10',
    borderColor: 'border-[#027E46]',
  },
  {
    type: 'alertas' as InsightType,
    label: 'ALERTAS',
    icon: Bell,
    color: 'text-[#FFAB00]',
    bgColor: 'bg-[#FFAB00]/10',
    borderColor: 'border-[#FFAB00]',
  },
  {
    type: 'recomendacoes' as InsightType,
    label: 'RECOMENDAÇÕES',
    icon: Target,
    color: 'text-[#0070D2]',
    bgColor: 'bg-[#0070D2]/10',
    borderColor: 'border-[#0070D2]',
  },
  {
    type: 'descobertas' as InsightType,
    label: 'DESCOBERTAS',
    icon: Search,
    color: 'text-[#9795e4]',
    bgColor: 'bg-[#9795e4]/10',
    borderColor: 'border-[#9795e4]',
  },
]

interface OverviewPanelProps {
  insights?: AIInsight[]
  onInsightClick?: (insight: AIInsight) => void
}

export function OverviewPanel({ 
  insights = MOCK_AI_INSIGHTS,
  onInsightClick 
}: OverviewPanelProps) {
  const [activePanel, setActivePanel] = useState<InsightType>('previsoes')

  const filteredInsights = insights.filter((insight) => insight.type === activePanel)

  const getPriorityBadge = (priority: AIInsight['priority']) => {
    const variants: Record<string, string> = {
      high: 'bg-[#C23934] text-white',
      medium: 'bg-[#FFAB00] text-white',
      low: 'bg-[#027E46] text-white',
    }
    return variants[priority] || variants.low
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Buttons */}
      <div className="flex flex-col gap-1.5 border-b-2 border-border p-2">
        {INSIGHT_TYPES.map(({ type, label, icon: Icon, color, bgColor, borderColor }) => {
          const count = insights.filter((i) => i.type === type).length
          const isActive = activePanel === type

          return (
            <Button
              key={type}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => setActivePanel(type)}
              className={cn(
                'h-auto justify-start gap-2 p-2 transition-all',
                isActive && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]',
                !isActive && 'hover:bg-muted'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2',
                  isActive ? 'border-white bg-white/20' : cn(borderColor, bgColor)
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : color)} strokeWidth={2} />
              </div>
              <div className="flex flex-1 flex-col items-start gap-0.5">
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    isActive ? 'text-white' : 'text-foreground'
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    'text-[9px]',
                    isActive ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {count} insight{count !== 1 ? 's' : ''}
                </span>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Insights Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Nenhum insight disponível
              </p>
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <Card
                key={insight.id}
                className="cursor-pointer rounded-sm border-2 border-border transition-all hover:border-[#9795e4] hover:shadow-md"
                onClick={() => onInsightClick?.(insight)}
              >
                <CardHeader className="p-2.5 pb-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-[11px] font-semibold leading-tight text-foreground">
                      {insight.title}
                    </CardTitle>
                    <Badge
                      className={cn(
                        'shrink-0 rounded-sm text-[9px] font-semibold px-1.5 py-0.5',
                        getPriorityBadge(insight.priority)
                      )}
                    >
                      {insight.priority === 'high' && 'ALTA'}
                      {insight.priority === 'medium' && 'MÉDIA'}
                      {insight.priority === 'low' && 'BAIXA'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-2.5 pt-0">
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.impact && (
                    <div className="mt-2 rounded-sm bg-muted p-1.5">
                      <p className="text-[9px] font-semibold text-foreground">
                        IMPACTO:
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {insight.impact}
                      </p>
                    </div>
                  )}
                  {insight.confidence !== undefined && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-[#9795e4] to-[#b3b3e5]"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {insight.confidence}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
