'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bell,
  Target,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIInsight, InsightType } from '@/lib/types/ai-insights'

interface AISubSidebarProps {
  insights?: AIInsight[]
  defaultExpanded?: boolean
  onInsightClick?: (insight: AIInsight) => void
}

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

export function AISubSidebar({
  insights = [],
  defaultExpanded = true,
  onInsightClick,
}: AISubSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [activePanel, setActivePanel] = useState<InsightType>('previsoes')
  const [mountedTimestamp, setMountedTimestamp] = useState<string>('')

  // Set timestamp only on client to avoid hydration mismatch
  useEffect(() => {
    setMountedTimestamp(new Date().toLocaleString('pt-BR'))
  }, [])

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
    <div
      className={cn(
        'relative flex h-full flex-col border-r-2 border-border bg-background transition-all duration-300 mt-[76px]',
        isExpanded ? 'w-[220px]' : 'w-[70px]'
      )}
    >
      {/* Header with Toggle */}
      <div className="flex items-center justify-between border-b-2 border-border p-4">
        {isExpanded && (
          <h2 className="text-sm font-semibold text-foreground">AI INSIGHTS</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 shrink-0"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-2 border-b-2 border-border p-2">
        {INSIGHT_TYPES.map(({ type, label, icon: Icon, color, bgColor, borderColor }) => {
          const count = insights.filter((i) => i.type === type).length
          const isActive = activePanel === type

          return (
            <Button
              key={type}
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => setActivePanel(type)}
              className={cn(
                'h-auto justify-start gap-3 p-3 transition-all',
                isActive && 'bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]',
                !isActive && 'hover:bg-muted'
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border-2',
                  isActive ? 'border-white bg-white/20' : cn(borderColor, bgColor)
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : color)} strokeWidth={1.8} />
              </div>
              {isExpanded && (
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      isActive ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {count} insight{count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </Button>
          )
        })}
      </div>

      {/* Insights Content Area */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
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
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xs font-semibold leading-tight text-foreground">
                        {insight.title}
                      </CardTitle>
                      <Badge
                        className={cn(
                          'shrink-0 rounded-sm text-[10px] font-semibold',
                          getPriorityBadge(insight.priority)
                        )}
                      >
                        {insight.priority === 'high' && 'ALTA'}
                        {insight.priority === 'medium' && 'MÉDIA'}
                        {insight.priority === 'low' && 'BAIXA'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {insight.description}
                    </p>
                    {insight.impact && (
                      <div className="mt-2 rounded-sm bg-muted p-2">
                        <p className="text-[10px] font-semibold text-foreground">
                          IMPACTO:
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {insight.impact}
                        </p>
                      </div>
                    )}
                    {insight.confidence !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-[#9795e4] to-[#b3b3e5]"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">
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
      )}

      {/* Footer (Collapsed State Indicators) */}
      {!isExpanded && (
        <div className="flex flex-col gap-2 p-2">
          {INSIGHT_TYPES.map(({ type, icon: Icon, color, bgColor, borderColor }) => {
            const count = insights.filter((i) => i.type === type).length
            const isActive = activePanel === type

            return (
              <button
                key={type}
                onClick={() => {
                  setActivePanel(type)
                  setIsExpanded(true)
                }}
                className={cn(
                  'relative flex h-12 w-full items-center justify-center rounded-sm border-2 transition-all hover:scale-105',
                  isActive
                    ? 'border-[#9795e4] bg-gradient-to-br from-[#9795e4] to-[#b3b3e5]'
                    : cn(borderColor, bgColor, 'hover:opacity-80')
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : color)} />
                {count > 0 && (
                  <span
                    className={cn(
                      'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                      isActive
                        ? 'bg-white text-[#9795e4]'
                        : 'bg-[#C23934] text-white'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Timestamp Footer */}
      {isExpanded && (
        <div className="border-t-2 border-border p-3">
          <p className="text-[10px] text-muted-foreground">
            Atualizado: {mountedTimestamp || '...'}
          </p>
        </div>
      )}
    </div>
  )
}
