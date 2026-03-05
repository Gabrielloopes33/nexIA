/**
 * KPI Calculator Utilities
 * Helper functions to calculate dashboard KPIs from lead data
 */

import { Contact } from '@/lib/types/contact'

export interface KPIResult {
  value: number
  count?: number
  change?: number
}

/**
 * Calculate total pipeline value from active/converted leads
 */
export function calculatePipelineTotal(leads: Contact[]): KPIResult {
  const leadsWithRevenue = leads.filter((l) => l.receita && l.receita > 0)
  const total = leadsWithRevenue.reduce((sum, l) => sum + (l.receita || 0), 0)

  return {
    value: total,
    count: leadsWithRevenue.length,
    change: 15.8, // Mock change percentage
  }
}

/**
 * Calculate average ticket value from deals with revenue
 */
export function calculateAverageTicket(leads: Contact[]): KPIResult {
  const dealsWithRevenue = leads.filter((l) => l.receita && l.receita > 0)

  if (dealsWithRevenue.length === 0) {
    return { value: 0, count: 0, change: 0 }
  }

  const total = dealsWithRevenue.reduce((sum, l) => sum + (l.receita || 0), 0)
  const average = total / dealsWithRevenue.length

  return {
    value: average,
    count: dealsWithRevenue.length,
    change: 8.2, // Mock change percentage
  }
}

/**
 * Calculate average conversion time in days
 */
export function calculateConversionTime(leads: Contact[]): KPIResult {
  const convertedLeads = leads.filter(
    (l) => l.receita && l.receita > 0 && l.criadoEm && l.atualizadoEm
  )

  if (convertedLeads.length === 0) {
    return { value: 0, count: 0, change: 0 }
  }

  const conversionTimes = convertedLeads.map((l) => {
    const created = new Date(l.criadoEm!).getTime()
    const updated = new Date(l.atualizadoEm!).getTime()
    return Math.floor((updated - created) / (1000 * 60 * 60 * 24))
  })

  const average = Math.round(
    conversionTimes.reduce((sum, days) => sum + days, 0) / conversionTimes.length
  )

  return {
    value: average,
    count: convertedLeads.length,
    change: -12.5, // Negative is good (less time)
  }
}

/**
 * Calculate average lead score
 */
export function calculateAverageLeadScore(leads: Contact[]): KPIResult {
  const leadsWithScore = leads.filter((l) => l.leadScore !== undefined)

  if (leadsWithScore.length === 0) {
    return { value: 0, count: 0, change: 0 }
  }

  const total = leadsWithScore.reduce((sum, l) => sum + (l.leadScore || 0), 0)
  const average = Math.round(total / leadsWithScore.length)

  return {
    value: average,
    count: leadsWithScore.length,
    change: 5.3, // Mock change percentage
  }
}

/**
 * Calculate all KPIs at once
 */
export function calculateAllKPIs(leads: Contact[]) {
  return {
    pipeline: calculatePipelineTotal(leads),
    ticket: calculateAverageTicket(leads),
    conversion: calculateConversionTime(leads),
    score: calculateAverageLeadScore(leads),
  }
}
