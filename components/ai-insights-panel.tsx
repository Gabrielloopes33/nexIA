/**
 * AI Insights Panel Component
 * Painel com 4 seções de insights gerados por IA:
 * 1. Previsões: Predições de conversão e pipeline
 * 2. Alertas: Leads sem contato, deals em risco
 * 3. Recomendações: Otimizações de budget e ações prioritárias
 * 4. Insights: Tendências e padrões descobertos
 */

'use client'

import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Clock,
  DollarSign,
  Users,
  Zap
} from 'lucide-react'

interface Insight {
  icon: typeof TrendingUp
  iconColor: string
  iconBg: string
  title: string
  description: string
  value?: string
  action?: string
}

export function AiInsightsPanel() {
  const previsoes: Insight[] = [
    {
      icon: TrendingUp,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      title: '23 leads provavelmente converterão',
      description: 'Baseado em engajamento alto e padrões históricos de conversão',
      value: 'Este mês',
      action: 'Ver lista'
    },
    {
      icon: DollarSign,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Pipeline deve fechar R$ 87.500',
      description: 'Projeção para próximos 30 dias',
      value: '89% confiança'
    }
  ]

  const alertas: Insight[] = [
    {
      icon: Clock,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      title: '12 leads sem contato há 7+ dias',
      description: 'Risco de perda por inatividade',
      action: 'Revisar leads'
    },
    {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: '5 deals em risco de perda',
      description: 'Baixo engajamento nas últimas 2 semanas',
      action: 'Tomar ação'
    }
  ]

  const recomendacoes: Insight[] = [
    {
      icon: Zap,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'Aumentar budget em "LinkedIn"',
      description: 'ROI de 4.2x, melhor canal atual',
      value: '+15%',
      action: 'Simular'
    },
    {
      icon: Target,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      title: 'Focar em leads "Demo Solicitada"',
      description: 'Taxa de conversão 38%, acima da média',
      action: 'Filtrar'
    }
  ]

  const insights: Insight[] = [
    {
      icon: Clock,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Terça 10h-12h é melhor horário',
      description: 'Taxa de resposta 45%, 2x acima da média',
      value: '🔥 Hot'
    },
    {
      icon: Users,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      title: 'Leads "Enterprise" têm ciclo +23%',
      description: 'Ciclo médio: 23 dias vs 18 dias geral',
      action: 'Analisar'
    }
  ]

  const renderInsightCard = (insight: Insight, index: number) => {
    const Icon = insight.icon
    
    return (
      <div 
        key={index}
        className="group flex items-start gap-3 p-3 rounded-sm bg-card transition-all cursor-pointer min-h-[120px]"
      >
        <div className={`${insight.iconBg} p-2 rounded-sm flex-shrink-0`}>
          <Icon className={`h-4 w-4 ${insight.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold leading-tight">
              {insight.title}
            </h4>
            {insight.value && (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {insight.value}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 leading-relaxed flex-1">
            {insight.description}
          </p>
          {insight.action && (
            <button className="text-xs font-medium text-primary hover:underline">
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="p-6 rounded-sm shadow-sm bg-gradient-to-br from-purple-50/50 to-blue-50/50">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-br from-[#46347F] to-[#46347F] p-2 rounded-sm">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold">Insights de IA</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            Atualizado há 5 min
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Análise inteligente do seu pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* Seção 1: Previsões */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-semibold text-green-600">
              Previsões
            </h4>
          </div>
          <div className="space-y-3 flex-1">
            {previsoes.map(renderInsightCard)}
          </div>
        </div>

        {/* Seção 2: Alertas */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <h4 className="text-sm font-semibold text-yellow-600">
              Alertas
            </h4>
          </div>
          <div className="space-y-3 flex-1">
            {alertas.map(renderInsightCard)}
          </div>
        </div>

        {/* Seção 3: Recomendações */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-600">
              Recomendações
            </h4>
          </div>
          <div className="space-y-3 flex-1">
            {recomendacoes.map(renderInsightCard)}
          </div>
        </div>

        {/* Seção 4: Insights */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-purple-600">
              Descobertas
            </h4>
          </div>
          <div className="space-y-3 flex-1">
            {insights.map(renderInsightCard)}
          </div>
        </div>
      </div>

      {/* Footer com açõesg*/}
      <div className="mt-6 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Powered by IA • Confiança média: <span className="font-semibold">87%</span>
          </p>
          <button className="text-xs font-medium text-primary hover:underline">
            Ver todos insights →
          </button>
        </div>
      </div>
    </Card>
  )
}
