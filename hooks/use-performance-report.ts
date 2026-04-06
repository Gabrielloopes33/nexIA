'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const SWR_CONFIG = {
  refreshInterval: 5 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
}

export type ReportPeriod = '3h' | '6h' | '12h' | '24h' | '7d' | '30d'
export type GroupBy = 'hour' | 'day'

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  '3h': 'Últimas 3h',
  '6h': 'Últimas 6h',
  '12h': 'Últimas 12h',
  '24h': 'Últimas 24h',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
}

// ── Atendimento ──────────────────────────────────────────────
export interface AtendimentoData {
  period: string
  periodStart: string
  conversasAbertas: { value: number; change: number }
  conversasFechadas: { value: number; change: number }
  conversasAtivas: number
  conversasSemAtribuicao: number
  taxaResolucao: { value: number; change: number }
  tmrSegundos: number
  mensagensRecebidas: number
  mensagensEnviadas: number
}

export function useAtendimentoReport(period: ReportPeriod) {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: AtendimentoData }>(
    `/api/reports/atendimento?period=${period}`,
    fetcher,
    SWR_CONFIG
  )
  return { data: data?.data, isLoading, error }
}

// ── Lead Flow ─────────────────────────────────────────────────
export interface LeadFlowChannel {
  id: string
  name: string
}

export interface LeadFlowPoint {
  bucket: string
  total: number
  [channelId: string]: number | string
}

export interface HeatmapPoint {
  dow: number
  hour: number
  count: number
}

export interface LeadFlowData {
  period: string
  groupBy: string
  periodStart: string
  totalNovas: number
  channels: LeadFlowChannel[]
  flow: LeadFlowPoint[]
  heatmap: HeatmapPoint[]
}

export function useLeadFlowReport(period: ReportPeriod, groupBy: GroupBy = 'hour') {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: LeadFlowData }>(
    `/api/reports/lead-flow?period=${period}&groupBy=${groupBy}`,
    fetcher,
    SWR_CONFIG
  )
  return { data: data?.data, isLoading, error }
}

// ── Campaigns Performance ─────────────────────────────────────
export interface CampaignConsolidado {
  totalCampanhas: number
  totalEnviados: number
  totalFalhas: number
  totalJanelasAbertas: number
  totalJanelasAproveitadas: number
  totalJanelasExpiradas: number
  totalConversoes: number
  taxaEngajamentoMedia: number
}

export interface CampaignMetrics {
  id: string
  nome: string
  templateName: string
  status: string
  startedAt: string | null
  completedAt: string | null
  tag: string | null
  totalContatos: number
  enviados: number
  falhas: number
  janelasAbertas: number
  janelasAproveitadas: number
  janelasExpiradas: number
  janelasAtivas: number
  taxaEngajamento: number
  taxaEntrega: number
  tmrContatoSegundos: number
  conversoes: number
  contatos?: ContactWindowDetail[]
}

export interface ContactWindowDetail {
  contactId: string
  phone: string
  name: string | null
  status: string
  sentAt: string | null
  gotReply: boolean
  windowExpired: boolean
  replyTimeSeconds: number | null
  conversationId: string | null
}

export interface CampaignPerformanceData {
  period: string
  periodStart: string
  consolidado: CampaignConsolidado
  campanhas: CampaignMetrics[]
}

export function useCampaignPerformance(period: ReportPeriod, campaignId?: string) {
  const params = new URLSearchParams({ period })
  if (campaignId) params.set('campaignId', campaignId)

  const { data, error, isLoading } = useSWR<{ success: boolean; data: CampaignPerformanceData }>(
    `/api/reports/campaigns-performance?${params}`,
    fetcher,
    SWR_CONFIG
  )
  return { data: data?.data, isLoading, error }
}

// ── Helpers ───────────────────────────────────────────────────
export function formatTMR(segundos: number): string {
  if (segundos === 0) return '—'
  if (segundos < 60) return `${segundos}s`
  if (segundos < 3600) return `${Math.round(segundos / 60)}min`
  const h = Math.floor(segundos / 3600)
  const m = Math.round((segundos % 3600) / 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function formatChange(change: number): { label: string; positive: boolean } {
  const positive = change >= 0
  return {
    label: `${positive ? '+' : ''}${change}%`,
    positive,
  }
}
