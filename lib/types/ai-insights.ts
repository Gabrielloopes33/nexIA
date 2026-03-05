/**
 * AI Insights Type Definitions
 * Types for AI-generated insights system
 */

export type InsightType = 'previsoes' | 'alertas' | 'recomendacoes' | 'descobertas'

export type InsightPriority = 'high' | 'medium' | 'low'

export interface AIInsight {
  id: string
  type: InsightType
  title: string
  description: string
  priority: InsightPriority
  impact?: string
  confidence?: number
  value?: string
  action?: string
  createdAt: Date
}

export interface InsightStats {
  total: number
  byType: Record<InsightType, number>
  highPriority: number
}
