import { prisma } from '@/lib/prisma'
import { ChannelType, Prisma } from '@prisma/client'

// Helper para obter valor do deal (value tem prioridade, com fallback para amount)
function getDealValue(deal: { value?: any; amount?: any; estimatedValue?: number | null }): number {
  return Number(deal.value) || Number(deal.amount) || deal.estimatedValue || 0
}

// Tipos de retorno (compatíveis com types/dashboard.ts)
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
  // Campos legados para compatibilidade
  name?: string
  avgTime?: number
}

export interface FunnelMetrics {
  stages: FunnelStage[]
  totalLeads: number
  totalValue: number
  avgConversionTime: number
}

// 1. Métricas do Funil - ETAPAS DINÂMICAS DO PIPELINE
export async function getFunnelMetrics(
  organizationId: string,
  period: string
): Promise<FunnelMetrics> {
  const startDate = getPeriodStartDate(period)
  
  // Buscar etapas dinâmicas do pipeline da organização
  const pipelineStages = await prisma.pipelineStage.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      position: 'asc',
    },
  })
  
  // Se não houver etapas configuradas, retorna vazio
  if (pipelineStages.length === 0) {
    return {
      stages: [],
      totalLeads: 0,
      totalValue: 0,
      avgConversionTime: 0,
    }
  }
  
  // Buscar deals do período com seus estágios
  const deals = await prisma.deal.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate },
    },
    include: {
      stageHistory: true,
    },
  })
  
  // Calcular métricas por etapa dinâmica
  const stages: FunnelStage[] = []
  
  for (const [index, pipelineStage] of pipelineStages.entries()) {
    // Filtrar deals que estão nesta etapa (pelo stageId)
    const dealsInStage = deals.filter(deal => deal.stageId === pipelineStage.id)

    const count = dealsInStage.length
    const value = dealsInStage.reduce((sum, deal) =>
      sum + getDealValue(deal), 0
    )

    // Taxa de conversão baseada no estágio anterior
    const prevCount = index === 0 ? count : stages[index - 1]?.count || count
    const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 100

    // Tempo médio no estágio (baseado no stageHistory)
    const avgTimeHours = calculateAvgStageTimeByStageId(dealsInStage, pipelineStage.id)
    
    // Lead score médio (se houver dados)
    const avgLeadScore = dealsInStage.reduce((sum, deal) => {
      // Buscar leadScore do contato através do metadata ou campo relacionado
      return sum + 0 // Placeholder - pode ser expandido
    }, 0) / (dealsInStage.length || 1)

    stages.push({
      stageId: pipelineStage.id,
      stageName: pipelineStage.name,
      position: pipelineStage.position,
      color: pipelineStage.color,
      count,
      value,
      avgLeadScore: Math.round(avgLeadScore),
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgTimeHours,
    })
  }
  
  // Calcular tempo médio total de conversão
  const avgConversionTime = calculateAvgConversionTime(deals)
  
  return {
    stages,
    totalLeads: deals.length,
    totalValue: stages.reduce((sum, stage) => sum + stage.value, 0),
    avgConversionTime,
  }
}

// 2. Leads Perdidos com Potencial de Recuperação
export interface RecoverableDeal {
  id: string
  title: string
  contactName: string
  value: number
  lostAt: Date
  lostReason: string
  daysSinceLost: number
  recoveryScore: number // 0-100
  lastActivity: Date
}

export async function getLostDealsWithRecoveryPotential(
  organizationId: string,
  period: string,
  limit: number = 10
): Promise<RecoverableDeal[]> {
  const startDate = getPeriodStartDate(period)
  
  // Buscar deals perdidos
  const lostDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'LOST',
      closedLostAt: { gte: startDate },
    },
    orderBy: { amount: 'desc' },
    take: limit * 2, // Pegar mais para filtrar
  })
  
  // Calcular score de recuperação baseado em:
  // - Valor do deal (maior = mais importante)
  // - Dias desde perda (menor = mais recente)
  // - Motivo da perda (alguns motivos são mais recuperáveis)
  // - Última atividade (se teve contato recente)
  
  return lostDeals.map(deal => {
    const daysSinceLost = Math.floor(
      (Date.now() - (deal.closedLostAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
    )
    
    const recoveryScore = calculateRecoveryScore(deal, daysSinceLost)
    
    return {
      id: deal.id,
      title: deal.title,
      contactName: 'Sem contato',
      value: getDealValue(deal),
      lostAt: deal.closedLostAt!,
      lostReason: deal.lostReason || 'OTHER',
      daysSinceLost,
      recoveryScore,
      lastActivity: deal.closedLostAt!,
    }
  }).filter(d => d.recoveryScore > 30).slice(0, limit)
}

// 3. Performance por Canal
export interface ChannelMetrics {
  channel: string
  leadsGenerated: number
  dealsWon: number
  revenueWon: number
  conversionRate: number
  messagesSent: number
  messagesReceived: number
  responseRate: number
  avgFirstResponseSecs: number
}

export async function getChannelPerformance(
  organizationId: string,
  period: string
): Promise<ChannelMetrics[]> {
  const startDate = getPeriodStartDate(period)
  
  const channels = Object.values(ChannelType)
  
  const metrics = await Promise.all(
    channels.map(async (channel) => {
      const [leads, deals, revenue] = await Promise.all([
        // Contar leads do canal
        prisma.deal.count({
          where: {
            organizationId,
            channel,
            createdAt: { gte: startDate },
          },
        }),
        // Contar deals fechados
        prisma.deal.count({
          where: {
            organizationId,
            channel,
            status: 'WON',
            closedWonAt: { gte: startDate },
          },
        }),
        // Somar receita
        prisma.deal.aggregate({
          where: {
            organizationId,
            channel,
            status: 'WON',
            closedWonAt: { gte: startDate },
          },
          _sum: { value: true },
        }),
      ])
      
      return {
        channel: channel as ChannelType,
        leadsGenerated: leads,
        dealsWon: deals,
        revenueWon: Number(revenue._sum.value) || 0,
        conversionRate: leads > 0 ? (deals / leads) * 100 : 0,
        messagesSent: 0,
        messagesReceived: 0,
        responseRate: 0,
        avgFirstResponseSecs: 0,
      }
    })
  )
  
  return metrics.filter(m => m.leadsGenerated > 0)
}

// 4. Motivos de Perda
export interface LossReasonStat {
  reason: string
  count: number
  percentage: number
  trend: number // vs período anterior
  avgDealValue: number
}

export async function getLostReasonsStats(
  organizationId: string,
  period: string
): Promise<LossReasonStat[]> {
  const startDate = getPeriodStartDate(period)
  const previousStartDate = getPreviousPeriodStart(period, startDate)
  
  // Buscar dados do período atual
  const currentPeriod = await prisma.deal.groupBy({
    by: ['lostReason'],
    where: {
      organizationId,
      status: 'LOST',
      closedLostAt: { gte: startDate },
      lostReason: { not: null },
    },
    _count: { id: true },
    _avg: { value: true },
  })
  
  // Buscar dados do período anterior para trend
  const previousPeriod = await prisma.deal.groupBy({
    by: ['lostReason'],
    where: {
      organizationId,
      status: 'LOST',
      closedLostAt: {
        gte: previousStartDate,
        lt: startDate,
      },
      lostReason: { not: null },
    },
    _count: { id: true },
  })
  
  const total = currentPeriod.reduce((sum, r) => sum + r._count.id, 0)
  
  return currentPeriod.map(stat => {
    const prevStat = previousPeriod.find(p => p.lostReason === stat.lostReason)
    const prevCount = prevStat?._count.id || 0
    const trend = prevCount > 0 
      ? ((stat._count.id - prevCount) / prevCount) * 100 
      : 0
    
    return {
      reason: stat.lostReason!,
      count: stat._count.id,
      percentage: total > 0 ? (stat._count.id / total) * 100 : 0,
      trend,
      avgDealValue: Number(stat._avg.value) || 0,
    }
  }).sort((a, b) => b.count - a.count)
}

// 5. Receita Semanal
export interface WeeklyRevenue {
  week: string
  weekStart: string
  weekEnd: string
  revenue: number
  dealsWon: number
  goal: number
  ticketAvg: number
}

export async function getWeeklyRevenue(
  organizationId: string,
  weeks: number = 8
): Promise<WeeklyRevenue[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))
  
  // Buscar deals fechados
  const deals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'WON',
      closedWonAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      closedWonAt: true,
    },
  })
  
  // Buscar metas para o período (últimos N meses)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth() + 1
  const goals = await prisma.monthlyGoal.findMany({
    where: {
      organizationId,
      OR: [
        { year: { gt: startYear } },
        { year: startYear, month: { gte: startMonth } }
      ]
    },
  })
  
  // Agrupar por semana
  const weeklyData: Record<string, { revenue: number; deals: number }> = {}
  
  deals.forEach(deal => {
    const weekKey = getWeekKey(deal.closedWonAt!)
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { revenue: 0, deals: 0 }
    }
    weeklyData[weekKey].revenue += Number(deal.value) || Number(deal.amount) || 0
    weeklyData[weekKey].deals += 1
  })
  
  // Preencher semanas sem dados
  const result: WeeklyRevenue[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - (i * 7))
    const weekKey = getWeekKey(date)
    const weekGoal = getWeeklyTarget(goals, date)
    const weekStart = getWeekStart(date)
    const weekEnd = getWeekEnd(date)
    const weekRevenue = weeklyData[weekKey]?.revenue || 0
    const weekDealsWon = weeklyData[weekKey]?.deals || 0
    
    result.push({
      week: weekKey,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      revenue: weekRevenue,
      dealsWon: weekDealsWon,
      goal: weekGoal,
      ticketAvg: weekDealsWon > 0 ? weekRevenue / weekDealsWon : 0,
    })
  }
  
  return result
}

// 6. KPIs do Header
export interface KpiData {
  leads: { value: number; change: number }
  revenue: { value: number; change: number }
  conversionRate: { value: number; change: number }
  pipelineValue: { value: number; change: number }
  avgDealTime: { value: number; change: number } // dias
}

export async function getKPIs(
  organizationId: string,
  period: string
): Promise<KpiData> {
  const startDate = getPeriodStartDate(period)
  const previousStartDate = getPreviousPeriodStart(period, startDate)
  
  // Calcular métricas para período atual e anterior em paralelo
  const [current, previous] = await Promise.all([
    calculateKPIsForPeriod(organizationId, startDate, new Date()),
    calculateKPIsForPeriod(organizationId, previousStartDate, startDate),
  ])
  
  return {
    leads: {
      value: current.leads,
      change: calculateChange(current.leads, previous.leads),
    },
    revenue: {
      value: current.revenue,
      change: calculateChange(current.revenue, previous.revenue),
    },
    conversionRate: {
      value: current.conversionRate,
      change: calculateChange(current.conversionRate, previous.conversionRate),
    },
    pipelineValue: {
      value: current.pipelineValue,
      change: calculateChange(current.pipelineValue, previous.pipelineValue),
    },
    avgDealTime: {
      value: current.avgDealTime,
      change: calculateChange(current.avgDealTime, previous.avgDealTime),
    },
  }
}

// 7. Dados para Health Score
export interface HealthScoreData {
  score: number
  status: 'SAUDÁVEL' | 'OK' | 'ATENÇÃO' | 'CRÍTICO'
  factors: {
    conversionVsGoal: { score: number; status: 'ACIMA' | 'NA_META' | 'ABAIXO' }
    funnelVelocity: { score: number; status: 'OK' | 'LENTO' | 'CRÍTICO' }
    stagnantLeads: { score: number; status: 'OK' | 'ATENÇÃO' | 'CRÍTICO' }
    followUpRate: { score: number; percentage: number }
  }
}

export async function getHealthScoreData(
  organizationId: string,
  period: string
): Promise<HealthScoreData> {
  const startDate = getPeriodStartDate(period)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  // Buscar dados necessários
  const [deals, goals, stagnantCount] = await Promise.all([
    prisma.deal.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      include: { stageHistory: true },
    }),
    prisma.monthlyGoal.findFirst({
      where: {
        organizationId,
        year: { lte: new Date().getFullYear() },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
    }),
    prisma.deal.count({
      where: {
        organizationId,
        status: { notIn: ['WON', 'LOST'] },
        updatedAt: { lt: oneWeekAgo },
      },
    }),
  ])

  const dealIds = deals.map(d => d.id)
  const activities = await prisma.dealActivity.count({
    where: {
      dealId: { in: dealIds },
      createdAt: { gte: oneWeekAgo },
    },
  })
  
  // Calcular fatores
  const wonDeals = deals.filter(d => d.status === 'WON').length
  const conversionRate = deals.length > 0 ? (wonDeals / deals.length) * 100 : 0
  const targetRate = 20 // Meta de conversão padrão
  
  const conversionVsGoal = conversionRate >= targetRate ? 'ACIMA' 
    : conversionRate >= targetRate * 0.8 ? 'NA_META' 
    : 'ABAIXO'
  
  // Calcular velocity do funil (tempo médio entre estágios)
  const funnelVelocity = calculateFunnelVelocity(deals)
  
  // Calcular follow-up rate
  const activeDeals = deals.filter(d => d.status !== 'WON' && d.status !== 'LOST').length
  const followUpRate = activeDeals > 0 ? Math.min(100, (activities / activeDeals) * 100) : 0
  
  // Calcular score ponderado
  const conversionScore = Math.min(100, (conversionRate / targetRate) * 40)
  const velocityScore = funnelVelocity.status === 'OK' ? 30 : funnelVelocity.status === 'LENTO' ? 20 : 10
  const stagnantScore = stagnantCount < 5 ? 15 : stagnantCount < 15 ? 10 : 5
  const followUpScore = (followUpRate / 100) * 15
  
  const score = Math.round(conversionScore + velocityScore + stagnantScore + followUpScore)
  
  return {
    score,
    status: score >= 85 ? 'SAUDÁVEL' : score >= 60 ? 'OK' : score >= 40 ? 'ATENÇÃO' : 'CRÍTICO',
    factors: {
      conversionVsGoal: { score: Math.round(conversionRate), status: conversionVsGoal },
      funnelVelocity: { score: funnelVelocity.score, status: funnelVelocity.status },
      stagnantLeads: { score: stagnantCount, status: stagnantCount > 10 ? 'ATENÇÃO' : 'OK' },
      followUpRate: { score: Math.round(followUpRate), percentage: Math.round(followUpRate) },
    },
  }
}

// Funções auxiliares
function getPeriodStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0))
    case '7d':
      return new Date(now.setDate(now.getDate() - 7))
    case '30d':
      return new Date(now.setDate(now.getDate() - 30))
    case '90d':
      return new Date(now.setDate(now.getDate() - 90))
    default:
      return new Date(now.setDate(now.getDate() - 30))
  }
}

function getPreviousPeriodStart(period: string, currentStart: Date): Date {
  const duration = Date.now() - currentStart.getTime()
  return new Date(currentStart.getTime() - duration)
}

function calculateRecoveryScore(deal: any, daysSinceLost: number): number {
  let score = 50
  
  // Valor (0-30 pontos)
  const value = getDealValue(deal)
  score += Math.min(value / 1000, 30)
  
  // Recência (0-30 pontos) - mais recente = melhor
  score += Math.max(0, 30 - daysSinceLost * 2)
  
  // Motivo (0-20 pontos) - alguns motivos são mais recuperáveis
  const recoverableReasons = ['TIMING', 'NO_BUDGET', 'NO_RESPONSE']
  if (recoverableReasons.includes(deal.lostReason)) {
    score += 20
  }
  
  // Atividade recente (0-20 pontos)
  const lastActivity = deal.activities?.[0]?.createdAt
  if (lastActivity) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )
    score += Math.max(0, 20 - daysSinceActivity)
  }
  
  return Math.min(100, Math.round(score))
}

function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d
}

function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function getWeeklyTarget(goals: any[], date: Date): number {
  const monthGoal = goals.find(g => 
    g.month === date.getMonth() + 1 &&
    g.year === date.getFullYear()
  )
  return monthGoal ? Number(monthGoal.revenueGoal) / 4 : 0 // Dividir por 4 semanas
}

async function calculateKPIsForPeriod(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  const [leads, revenue, pipeline, wonDeals] = await Promise.all([
    prisma.deal.count({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.deal.aggregate({
      where: {
        organizationId,
        status: 'WON',
        closedWonAt: { gte: startDate, lte: endDate },
      },
      _sum: { value: true },
    }),
    prisma.deal.aggregate({
      where: {
        organizationId,
        status: { notIn: ['WON', 'LOST'] },
      },
      _sum: { value: true },
    }),
    prisma.deal.count({
      where: {
        organizationId,
        status: 'WON',
        closedWonAt: { gte: startDate, lte: endDate },
      },
    }),
  ])
  
  // Calcular tempo médio do funil
  const stageHistory = await prisma.$queryRaw<{ avg_duration: number }[]>`
    SELECT AVG(duration) as avg_duration
    FROM "pipeline_stage_history"
    WHERE "exited_at" IS NOT NULL
      AND "entered_at" >= ${startDate}
      AND "entered_at" <= ${endDate}
  `
  
  return {
    leads,
    revenue: Number(revenue._sum.value) || 0,
    pipelineValue: Number(pipeline._sum.value) || 0,
    conversionRate: leads > 0 ? (wonDeals / leads) * 100 : 0,
    avgDealTime: (stageHistory[0]?.avg_duration || 0) / 24, // converter horas para dias
  }
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

function calculateAvgStageTime(deals: any[], stage: string): number {
  const durations = deals
    .map(deal => {
      const history = deal.stageHistory?.find((h: any) => h.stage === stage)
      return history?.duration || 0
    })
    .filter(d => d > 0)
  
  if (durations.length === 0) return 0
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
}

/**
 * Calcula o tempo médio em uma etapa específica baseado no stageId
 */
function calculateAvgStageTimeByStageId(deals: any[], stageId: string): number {
  const durations: number[] = []
  
  for (const deal of deals) {
    // Buscar no stageHistory pelo nome da etapa que corresponde ao stageId
    // ou calcular baseado no tempo que o deal passou nessa etapa
    const relevantHistory = deal.stageHistory?.filter((h: any) => {
      // Aqui podemos fazer matching por stage name ou usar outra lógica
      return h.duration && h.duration > 0
    })
    
    if (relevantHistory?.length > 0) {
      const totalDuration = relevantHistory.reduce((sum: number, h: any) => sum + (h.duration || 0), 0)
      durations.push(totalDuration)
    }
  }
  
  if (durations.length === 0) return 0
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
}

function calculateAvgConversionTime(deals: any[]): number {
  const durations = deals
    .map(deal => {
      if (!deal.closedWonAt || !deal.createdAt) return 0
      const diff = deal.closedWonAt.getTime() - deal.createdAt.getTime()
      return diff / (1000 * 60 * 60 * 24) // dias
    })
    .filter(d => d > 0)
  
  if (durations.length === 0) return 0
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
}

function calculateFunnelVelocity(deals: any[]): { score: number; status: 'OK' | 'LENTO' | 'CRÍTICO' } {
  const avgTime = calculateAvgConversionTime(deals)
  
  // Benchmark: 14 dias é o ideal
  if (avgTime <= 14) return { score: 90, status: 'OK' }
  if (avgTime <= 30) return { score: 70, status: 'OK' }
  if (avgTime <= 45) return { score: 50, status: 'LENTO' }
  return { score: 30, status: 'CRÍTICO' }
}

/**
 * Busca todas as métricas do dashboard em uma única chamada
 */
export async function getAllDashboardMetrics(organizationId: string) {
  const [
    funnel,
    lostDeals,
    channels,
    lostReasons,
    weeklyRevenue,
    kpis,
    healthScore,
  ] = await Promise.all([
    getFunnelMetrics(organizationId, '30d'),
    getLostDealsWithRecoveryPotential(organizationId, '30d', 5),
    getChannelPerformance(organizationId, '30d'),
    getLostReasonsStats(organizationId, '30d'),
    getWeeklyRevenue(organizationId, 12),
    getKPIs(organizationId, '30d'),
    getHealthScoreData(organizationId, '30d'),
  ])

  return {
    funnel,
    lostDeals,
    channels,
    lostReasons,
    weeklyRevenue,
    kpis,
    healthScore,
    generatedAt: new Date().toISOString(),
  }
}
