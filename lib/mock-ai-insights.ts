/**
 * Mock AI Insights Data
 * AI-generated insights for dashboard
 */

import { AIInsight, InsightType, InsightStats } from '@/lib/types/ai-insights'

export const MOCK_AI_INSIGHTS: AIInsight[] = [
  // PREVISÕES (3 insights)
  {
    id: 'prev-1',
    type: 'previsoes',
    title: '23 leads provavelmente converterão este mês',
    description: 'Baseado em lead score ≥80, engajamento alto e padrões históricos de conversão',
    priority: 'high',
    impact: 'Receita estimada: R$ 87.500',
    confidence: 89,
    value: 'Este mês',
    action: 'Ver lista',
    createdAt: new Date('2026-02-27T10:30:00'),
  },
  {
    id: 'prev-2',
    type: 'previsoes',
    title: 'Pipeline deve atingir R$ 125.000 em 30 dias',
    description: 'Projeção baseada em velocidade atual de geração e taxas de conversão por canal',
    priority: 'medium',
    impact: '+42% vs mês anterior',
    confidence: 82,
    value: '30 dias',
    createdAt: new Date('2026-02-27T09:15:00'),
  },
  {
    id: 'prev-3',
    type: 'previsoes',
    title: '8 leads Enterprise fecharão até Março',
    description: 'Leads com score alto, múltiplos touchpoints e ciclo de vendas avançado',
    priority: 'high',
    impact: 'Ticket médio: R$ 15.800',
    confidence: 76,
    value: 'R$ 126.400',
    action: 'Priorizar',
    createdAt: new Date('2026-02-27T08:45:00'),
  },

  // ALERTAS (4 insights)
  {
    id: 'alert-1',
    type: 'alertas',
    title: '12 leads sem contato há 7+ dias',
    description: 'Risco de perda por inatividade. Leads com alto potencial aguardando follow-up',
    priority: 'high',
    impact: 'Receita em risco: R$ 42.000',
    value: '12 leads',
    action: 'Revisar leads',
    createdAt: new Date('2026-02-27T11:00:00'),
  },
  {
    id: 'alert-2',
    type: 'alertas',
    title: '5 deals em risco de perda',
    description: 'Baixo engajamento nas últimas 2 semanas. Taxa de resposta caiu 65%',
    priority: 'high',
    impact: 'R$ 28.500 em risco',
    action: 'Tomar ação',
    createdAt: new Date('2026-02-27T10:45:00'),
  },
  {
    id: 'alert-3',
    type: 'alertas',
    title: 'Canal "Cold Email" com ROI negativo',
    description: 'Investimento de R$ 3.200 gerou apenas 2 conversões. ROI: -45%',
    priority: 'medium',
    impact: 'Perda: R$ 1.440/mês',
    action: 'Revisar estratégia',
    createdAt: new Date('2026-02-27T09:30:00'),
  },
  {
    id: 'alert-4',
    type: 'alertas',
    title: 'Tempo médio de resposta aumentou 38%',
    description: 'SLA de resposta subiu de 2h para 3h20min. Impacta satisfação do lead',
    priority: 'medium',
    value: '3h 20min',
    action: 'Analisar gargalos',
    createdAt: new Date('2026-02-27T08:00:00'),
  },

  // RECOMENDAÇÕES (3 insights)
  {
    id: 'rec-1',
    type: 'recomendacoes',
    title: 'Aumentar budget em "LinkedIn" (+15%)',
    description: 'ROI de 4.2x, melhor canal atual. Opportunity de escalar com baixo risco',
    priority: 'high',
    impact: '+12 leads qualificados/mês',
    value: 'ROI 4.2x',
    action: 'Simular',
    createdAt: new Date('2026-02-27T10:15:00'),
  },
  {
    id: 'rec-2',
    type: 'recomendacoes',
    title: 'Focar em leads "Demo Solicitada"',
    description: 'Taxa de conversão 38%, 2.3x acima da média. Priorizar follow-up rápido',
    priority: 'high',
    impact: '+8% taxa conversão geral',
    value: '38% conv.',
    action: 'Filtrar',
    createdAt: new Date('2026-02-27T09:45:00'),
  },
  {
    id: 'rec-3',
    type: 'recomendacoes',
    title: 'Implementar sequência automática para "Interesse Alto"',
    description: 'Leads com score 70-85 respondem bem a cadências de 5 touchpoints',
    priority: 'medium',
    impact: '+22% conversão neste segmento',
    confidence: 84,
    action: 'Configurar',
    createdAt: new Date('2026-02-27T08:30:00'),
  },

  // DESCOBERTAS (4 insights)
  {
    id: 'disc-1',
    type: 'descobertas',
    title: 'Terça-feira 10h-12h é melhor horário',
    description: 'Taxa de resposta 45%, 2.1x acima da média. Concentrar outbound neste período',
    priority: 'medium',
    impact: '+18% engajamento',
    value: '45% resp.',
    createdAt: new Date('2026-02-27T11:15:00'),
  },
  {
    id: 'disc-2',
    type: 'descobertas',
    title: 'Leads "Enterprise" têm ciclo +23% mais longo',
    description: 'Ciclo médio de 23 dias vs 18 dias geral. Ajustar expectativas e nurturing',
    priority: 'low',
    value: '23 dias',
    action: 'Analisar',
    createdAt: new Date('2026-02-27T10:00:00'),
  },
  {
    id: 'disc-3',
    type: 'descobertas',
    title: 'Objeção "Preço" é resolvível com case studies',
    description: '82% dos leads com objeção de preço convertem após apresentar ROI documentado',
    priority: 'medium',
    impact: 'Recuperação: 12 leads/mês',
    confidence: 78,
    action: 'Ver cases',
    createdAt: new Date('2026-02-27T09:00:00'),
  },
  {
    id: 'disc-4',
    type: 'descobertas',
    title: 'Padrão: 3+ interações = 67% conversão',
    description: 'Leads com 3 ou mais touchpoints convertem 3.2x mais que com 1-2 interações',
    priority: 'low',
    value: '67% conv.',
    createdAt: new Date('2026-02-27T07:45:00'),
  },
]

/**
 * Get insights by type
 */
export function getInsightsByType(type: InsightType): AIInsight[] {
  return MOCK_AI_INSIGHTS.filter((insight) => insight.type === type)
}

/**
 * Get insights by priority
 */
export function getInsightsByPriority(priority: AIInsight['priority']): AIInsight[] {
  return MOCK_AI_INSIGHTS.filter((insight) => insight.priority === priority)
}

/**
 * Get high priority insights
 */
export function getHighPriorityInsights(): AIInsight[] {
  return getInsightsByPriority('high')
}

/**
 * Get insight statistics
 */
export function getInsightStats(): InsightStats {
  const byType: Record<InsightType, number> = {
    previsoes: 0,
    alertas: 0,
    recomendacoes: 0,
    descobertas: 0,
  }

  MOCK_AI_INSIGHTS.forEach((insight) => {
    byType[insight.type]++
  })

  return {
    total: MOCK_AI_INSIGHTS.length,
    byType,
    highPriority: getHighPriorityInsights().length,
  }
}

/**
 * Get insights count by type
 */
export function getInsightCount(type: InsightType): number {
  return getInsightsByType(type).length
}
