/**
 * Mock Charts Data
 * Data for conversion funnel and UTM performance charts
 */

export interface ConversionStageData {
  stage: string
  value: number
  percentage: number
  color: string
}

export interface UTMSourceData {
  source: string
  leads: number
  conversions: number
  roi: number
  color: string
}

/**
 * Conversion Funnel Stages (for Donut Chart)
 * Stages: Lead → Qualificado → Demo → Proposta → Fechado
 */
export const CONVERSION_STAGES: ConversionStageData[] = [
  {
    stage: 'Lead',
    value: 125,
    percentage: 100,
    color: '#9795e4', // Purple
  },
  {
    stage: 'Qualificado',
    value: 68,
    percentage: 54.4,
    color: '#0070D2', // Blue
  },
  {
    stage: 'Demo Solicitada',
    value: 42,
    percentage: 33.6,
    color: '#FFAB00', // Yellow
  },
  {
    stage: 'Proposta Enviada',
    value: 28,
    percentage: 22.4,
    color: '#FF6B35', // Orange
  },
  {
    stage: 'Fechado',
    value: 18,
    percentage: 14.4,
    color: '#027E46', // Green
  },
]

/**
 * UTM Source Performance (for Horizontal Bar Chart)
 * Top sources by lead generation and conversion
 */
export const UTM_SOURCES: UTMSourceData[] = [
  {
    source: 'LinkedIn',
    leads: 45,
    conversions: 12,
    roi: 4.2,
    color: '#0077B5',
  },
  {
    source: 'Google Ads',
    leads: 38,
    conversions: 8,
    roi: 2.8,
    color: '#4285F4',
  },
  {
    source: 'Facebook',
    leads: 22,
    conversions: 5,
    roi: 1.9,
    color: '#1877F2',
  },
  {
    source: 'Indicação',
    leads: 12,
    conversions: 7,
    roi: 8.5,
    color: '#027E46',
  },
  {
    source: 'Orgânico',
    leads: 8,
    conversions: 3,
    roi: 5.2,
    color: '#9795e4',
  },
]

/**
 * Calculate conversion rate for a stage
 */
export function getConversionRate(fromStage: string, toStage: string): number {
  const from = CONVERSION_STAGES.find((s) => s.stage === fromStage)
  const to = CONVERSION_STAGES.find((s) => s.stage === toStage)

  if (!from || !to || from.value === 0) return 0

  return Math.round((to.value / from.value) * 100)
}

/**
 * Get top performing UTM source by ROI
 */
export function getTopUTMSource(): UTMSourceData {
  return UTM_SOURCES.reduce((prev, current) =>
    current.roi > prev.roi ? current : prev
  )
}

/**
 * Get total leads across all UTM sources
 */
export function getTotalLeadsFromUTM(): number {
  return UTM_SOURCES.reduce((sum, source) => sum + source.leads, 0)
}

/**
 * Get average ROI across all UTM sources
 */
export function getAverageROI(): number {
  const totalROI = UTM_SOURCES.reduce((sum, source) => sum + source.roi, 0)
  return Math.round((totalROI / UTM_SOURCES.length) * 10) / 10
}
