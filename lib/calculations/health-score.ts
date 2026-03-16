import { FunnelMetrics } from '@/types/dashboard'

export interface HealthScoreFactors {
  conversionVsGoal: {
    score: number
    status: 'ACIMA' | 'NA_META' | 'ABAIXO'
    actualRate: number
    targetRate: number
  }
  funnelVelocity: {
    score: number
    status: 'OK' | 'LENTO' | 'CRÍTICO'
    avgHours: number
  }
  stagnantLeads: {
    score: number
    status: 'OK' | 'ATENÇÃO' | 'CRÍTICO'
    count: number
    totalLeads: number
  }
  followUpRate: {
    score: number
    percentage: number
  }
}

export interface HealthScoreResult {
  totalScore: number
  status: 'SAUDÁVEL' | 'OK' | 'ATENÇÃO' | 'CRÍTICO'
  factors: HealthScoreFactors
}

// Pesos para cálculo do score final
const WEIGHTS = {
  conversionVsGoal: 0.30, // 30%
  funnelVelocity: 0.25,   // 25%
  stagnantLeads: 0.25,    // 25%
  followUpRate: 0.20,     // 20%
}

/**
 * Calcula o Health Score do dashboard baseado em múltiplos fatores
 * 
 * @param funnelData - Dados do funil de vendas
 * @param conversionRate - Taxa de conversão atual (%)
 * @param stagnantCount - Número de leads estagnados (> 7 dias sem atividade)
 * @param activitiesInLast7Days - Número de atividades nos últimos 7 dias
 * @param totalLeads - Total de leads no período
 * @returns Resultado completo do health score com fatores detalhados
 * 
 * @example
 * ```typescript
 * const result = calculateHealthScore(
 *   funnelData,
 *   24.5,  // taxa de conversão
 *   5,     // leads estagnados
 *   90,    // atividades na última semana
 *   100    // total de leads
 * )
 * ```
 */
export function calculateHealthScore(
  funnelData: FunnelMetrics,
  conversionRate: number,
  stagnantCount: number,
  activitiesInLast7Days: number,
  totalLeads: number
): HealthScoreResult {
  // 1. Conversão vs Meta (30%)
  const conversionFactor = calculateConversionFactor(conversionRate)
  
  // 2. Velocidade do Funil (25%)
  const velocityFactor = calculateVelocityFactor(funnelData.avgConversionTime)
  
  // 3. Leads Estagnados (25%)
  const stagnantFactor = calculateStagnantFactor(stagnantCount, totalLeads)
  
  // 4. Taxa de Follow-up (20%)
  const followUpFactor = calculateFollowUpFactor(activitiesInLast7Days, totalLeads)
  
  // Calcular score total (ponderado)
  const totalScore = Math.round(
    conversionFactor.score * WEIGHTS.conversionVsGoal +
    velocityFactor.score * WEIGHTS.funnelVelocity +
    stagnantFactor.score * WEIGHTS.stagnantLeads +
    followUpFactor.score * WEIGHTS.followUpRate
  )

  // Determinar status
  const status = getHealthStatus(totalScore)

  return {
    totalScore,
    status,
    factors: {
      conversionVsGoal: conversionFactor,
      funnelVelocity: velocityFactor,
      stagnantLeads: stagnantFactor,
      followUpRate: followUpFactor,
    },
  }
}

/**
 * Calcula o fator de conversão vs meta
 * Meta: 20% de conversão
 */
function calculateConversionFactor(
  conversionRate: number
): HealthScoreFactors['conversionVsGoal'] {
  const targetRate = 20 // Meta de conversão: 20%
  
  let score: number
  let status: HealthScoreFactors['conversionVsGoal']['status']
  
  if (conversionRate >= targetRate) {
    score = Math.min(100, 70 + (conversionRate - targetRate) * 3)
    status = 'ACIMA'
  } else if (conversionRate >= targetRate * 0.8) {
    score = 50 + ((conversionRate - targetRate * 0.8) / (targetRate * 0.2)) * 20
    status = 'NA_META'
  } else {
    score = Math.max(0, (conversionRate / (targetRate * 0.8)) * 50)
    status = 'ABAIXO'
  }
  
  return {
    score: Math.round(score),
    status,
    actualRate: conversionRate,
    targetRate,
  }
}

/**
 * Calcula o fator de velocidade do funil
 * Ideal: 48-72 horas por estágio
 * Lento: > 120 horas
 * Crítico: > 168 horas (1 semana)
 */
function calculateVelocityFactor(
  avgHours: number
): HealthScoreFactors['funnelVelocity'] {
  let score: number
  let status: HealthScoreFactors['funnelVelocity']['status']
  
  if (avgHours <= 72) {
    score = 100 - ((avgHours - 48) / 24) * 20
    status = 'OK'
  } else if (avgHours <= 120) {
    score = 80 - ((avgHours - 72) / 48) * 30
    status = 'LENTO'
  } else {
    score = Math.max(0, 50 - ((avgHours - 120) / 48) * 50)
    status = 'CRÍTICO'
  }
  
  return {
    score: Math.round(score),
    status,
    avgHours,
  }
}

/**
 * Calcula o fator de leads estagnados
 * Stagnant = leads sem atualização há > 7 dias
 */
function calculateStagnantFactor(
  stagnantCount: number, 
  totalLeads: number
): HealthScoreFactors['stagnantLeads'] {
  const percentage = totalLeads > 0 ? (stagnantCount / totalLeads) * 100 : 0
  
  let score: number
  let status: HealthScoreFactors['stagnantLeads']['status']
  
  if (percentage <= 10) {
    score = 100 - percentage * 2
    status = 'OK'
  } else if (percentage <= 25) {
    score = 80 - (percentage - 10) * 2
    status = 'ATENÇÃO'
  } else {
    score = Math.max(0, 50 - (percentage - 25) * 2)
    status = 'CRÍTICO'
  }
  
  return {
    score: Math.round(score),
    status,
    count: stagnantCount,
    totalLeads,
  }
}

/**
 * Calcula o fator de taxa de follow-up
 * Meta: pelo menos 1 atividade por lead a cada 7 dias (80% dos leads)
 */
function calculateFollowUpFactor(
  activitiesCount: number, 
  totalLeads: number
): HealthScoreFactors['followUpRate'] {
  const targetActivities = totalLeads * 0.8 // 80% dos leads devem ter atividade
  const percentage = targetActivities > 0 ? (activitiesCount / targetActivities) * 100 : 0
  
  const score = Math.min(100, Math.round(percentage))
  
  return {
    score,
    percentage: Math.round(percentage),
  }
}

/**
 * Determina o status geral do health score baseado no score total
 */
function getHealthStatus(score: number): HealthScoreResult['status'] {
  if (score >= 85) return 'SAUDÁVEL'
  if (score >= 60) return 'OK'
  if (score >= 40) return 'ATENÇÃO'
  return 'CRÍTICO'
}

export default calculateHealthScore
