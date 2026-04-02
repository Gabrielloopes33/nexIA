/**
 * Types para Dashboard CRM Metrics
 * 
 * Este arquivo contém todos os tipos TypeScript compartilhados
 * para as métricas do dashboard de vendas.
 */

// ============================================
// FUNIL POR ETAPA
// ============================================

export interface FunnelStage {
  stageId: string
  stageName: string
  position: number
  color: string | null
  count: number
  value: number
  avgLeadScore: number
  conversionRate: number
  avgTimeHours: number
}

export interface FunnelMetrics {
  stages: FunnelStage[]
  totalLeads: number
  totalValue: number
  avgConversionTime: number
}

// ============================================
// RECUPERAÇÃO DE PERDIDOS
// ============================================

export interface LostDeal {
  id: string
  title: string
  contactName: string | null
  amount: number | null
  lostReason: string
  lostReasonDetail: string | null
  lostAt: string // ISO date
  recoveryPotential: string | null
  recoveryScore: number | null
  daysSinceLost: number
}

export interface LostReasonStats {
  reason: string
  count: number
  value: number
  percentage: number
}

export interface LostDealsMetrics {
  totalLost: number
  lostValue: number
  byReason: LostReasonStats[]
  recoverable: LostDeal[]
  recoveryPotential: {
    high: number
    medium: number
    low: number
  }
}

// ============================================
// PERFORMANCE POR CANAL
// ============================================

export type ChannelType = 'WHATSAPP_OFFICIAL' | 'WHATSAPP_UNOFFICIAL' | 'INSTAGRAM' | 'MANUAL'

export interface ChannelPerformance {
  channel: ChannelType
  messagesSent: number
  messagesReceived: number
  responseRate: number
  avgFirstResponseSecs: number
  leadsGenerated: number
  dealsWon: number
  revenueWon: number
  conversionRate: number
}

// ============================================
// MOTIVOS DE PERDA
// ============================================

export interface LostReasonTrend {
  reason: string
  count: number
  value: number
  change: number // % vs período anterior
  trend: 'up' | 'down' | 'stable'
}

// ============================================
// RECEITA SEMANAL
// ============================================

export interface WeeklyRevenue {
  week: string
  weekStart: string // ISO date
  weekEnd: string // ISO date
  revenue: number
  dealsWon: number
  goal: number
  ticketAvg: number
}

export interface WeeklyRevenueSummary {
  totalRevenue: number
  totalGoal: number
  totalDeals: number
  avgTicket: number
  goalAchievement: number
}

export interface RevenueMetrics {
  weeks: WeeklyRevenue[]
  summary: WeeklyRevenueSummary
}

// ============================================
// HEALTH SCORE
// ============================================

export interface HealthScoreFactors {
  conversionScore: number
  funnelVelocityScore: number
  stagnationScore: number
  followUpScore: number
}

export type HealthStatus = 'excellent' | 'good' | 'average' | 'poor' | 'critical'

export interface HealthScore {
  total: number
  factors: HealthScoreFactors
  status: HealthStatus
  recommendations: string[]
}

// ============================================
// KPIs VERTICAIS
// ============================================

export interface KPIs {
  leadsThisWeek: number
  leadsGrowth: number
  closedRevenue: number
  revenueGrowth: number
  conversionRate: number
  conversionChange: number
  pipelineValue: number
  pipelineChange: number
  avgDealTime: number
  avgDealTimeChange: number
}

// ============================================
// KPIs PARA SIDEBAR (Coluna Vertical)
// ============================================

export type KpiFormat = 'number' | 'currency' | 'percentage' | 'duration'
export type KpiTrend = 'up' | 'down' | 'neutral'
export type KpiChangeType = 'positive' | 'negative' | 'neutral'

export interface KpiItem {
  id: string
  label: string
  value: number
  previousValue?: number
  change: number
  changeType: KpiChangeType
  format: KpiFormat
  trend: KpiTrend
  prefix?: string
  suffix?: string
}

// Alias para compatibilidade com componentes existentes
export type KpiData = KpiItem

export interface KpisData {
  kpis: KpiItem[]
  lastUpdated: string
}

// ============================================
// MÉTRICAS CONSOLIDADAS
// ============================================

export interface DashboardMetrics {
  funnel: FunnelMetrics
  lostDeals: LostDealsMetrics
  channels: ChannelPerformance[]
  lostReasons: LostReasonTrend[]
  weeklyRevenue: WeeklyRevenue[]
  healthScore: HealthScore
  kpis: KPIs
}

// ============================================
// RESPOSTAS DA API
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  meta?: {
    timestamp: string
    cached?: boolean
    cachedAt?: string
    expiresAt?: string
    [key: string]: any
  }
}

export type FunnelResponse = ApiResponse<FunnelMetrics>
export type LostDealsResponse = ApiResponse<LostDealsMetrics>
export type ChannelsResponse = ApiResponse<ChannelPerformance[]>
export type LostReasonsResponse = ApiResponse<LostReasonTrend[]>
export type RevenueResponse = ApiResponse<RevenueMetrics>
export type HealthScoreResponse = ApiResponse<HealthScore>
export type KPIsResponse = ApiResponse<KPIs>
export type AllMetricsResponse = ApiResponse<DashboardMetrics>

// ============================================
// PARÂMETROS DE QUERY
// ============================================

export type PeriodParam = '7d' | '30d' | '90d' | 'current_month'

export interface DashboardQueryParams {
  organizationId: string
  period?: PeriodParam
  days?: number
  weeks?: number
  currentDays?: number
}
