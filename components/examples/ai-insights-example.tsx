'use client'

import { useAiInsights } from '@/hooks/use-ai-insights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Lightbulb, Zap, Eye, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const TYPE_ICONS = {
  PREDICTION: TrendingUp,
  ALERT: AlertTriangle,
  RECOMMENDATION: Zap,
  DISCOVERY: Lightbulb,
}

const TYPE_COLORS = {
  PREDICTION: 'bg-green-100 text-green-700',
  ALERT: 'bg-red-100 text-red-700',
  RECOMMENDATION: 'bg-blue-100 text-blue-700',
  DISCOVERY: 'bg-purple-100 text-purple-700',
}

export function AiInsightsExample() {
  const {
    insights,
    total,
    isLoading,
    error,
    updateInsight,
    deleteInsight,
  } = useAiInsights({
    status: 'ACTIVE',
    limit: 10,
  })

  // Marcar como visualizado
  const handleClick = async (id: string) => {
    await updateInsight(id, { clickedAt: new Date().toISOString() })
  }

  // Dismiss insight
  const handleDismiss = async (id: string) => {
    await updateInsight(id, { status: 'DISMISSED' })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Erro ao carregar insights: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          Insights de IA
          {total > 0 && (
            <Badge variant="secondary">{total}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum insight ativo no momento
          </p>
        ) : (
          insights.map((insight) => {
            const Icon = TYPE_ICONS[insight.type]
            return (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className={`p-2 rounded-md ${TYPE_COLORS[insight.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    {insight.value && (
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        {insight.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                  {insight.confidence && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Confiança: {Math.round(insight.confidence * 100)}%
                    </p>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {insight.actionUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleClick(insight.id)}
                      asChild
                    >
                      <a href={insight.actionUrl}>
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDismiss(insight.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
