/**
 * Tipos do Dashboard
 * 
 * Centraliza todas as tipagens relacionadas ao dashboard
 * para facilitar manutenção e garantir consistência.
 */

// ==========================================
// Filtros e Contexto
// ==========================================

export type DashboardPeriod = '7d' | '30d' | '90d'

export interface DateRange {
  label: string
  startDate: Date
  endDate: Date
}

export interface DashboardFilters {
  period: DashboardPeriod
  dateRange: DateRange
  selectedUsers: string[]
}

// ==========================================
// Funil
// ==========================================

export interface FunilEtapa {
  id: string
  nome: string
  quantidade: number
  valor: number
  cor: string
  ordem: number
}

export interface FunilPorEtapaData {
  etapas: FunilEtapa[]
  totalLeads: number
  taxaConversaoGeral: number
  valorTotal: number
}

export interface FunilConversaoData {
  etapas: Array<{
    nome: string
    entrada: number
    saida: number
    taxa: number
  }>
}

// ==========================================
// KPIs
// ==========================================

export interface MetricasKPIData {
  receita: {
    total: number
    aberto: number
    fechado: number
    crescimento: number
  }
  ticketMedio: {
    valor: number
    crescimento: number
  }
  conversao: {
    taxa: number
    melhoria: number
  }
  conversas: {
    ativas: number
    total: number
    novas: number
  }
  leads: {
    total: number
    novos: number
    qualificados: number
  }
}

// ==========================================
// Leads
// ==========================================

export interface LeadRecente {
  id: string
  nome: string
  telefone?: string
  email?: string
  etapa: string
  valor?: number
  dataEntrada: string
  fonte?: string
}

export interface LeadsRecentesData {
  leads: LeadRecente[]
  total: number
}

export interface LeadTendencia {
  periodo: string
  total: number
  verificados: number
  pendentes: number
  conversao: number
}

export interface LeadsTendenciasData {
  tendencias: LeadTendencia[]
  comparativo: {
    atual: number
    anterior: number
    variacao: number
  }
}

// ==========================================
// Conversas
// ==========================================

export interface ConversaVolume {
  periodo: string
  whatsapp: number
  instagram: number
  telegram: number
  iframe: number
  total: number
}

export interface ConversasVolumeData {
  volumes: ConversaVolume[]
  total: number
  porCanal: {
    whatsapp: number
    instagram: number
    telegram: number
    iframe: number
  }
}

export interface AtividadeHeatmapData {
  dias: Array<{
    dia: string
    horas: Array<{
      hora: number
      quantidade: number
      intensidade: 'baixa' | 'media' | 'alta'
    }>
  }>
}

// ==========================================
// Performance
// ==========================================

export interface Objecao {
  tipo: string
  quantidade: number
  porcentagem: number
  tendencia: 'up' | 'down' | 'stable'
}

export interface ObjecoesData {
  objecoes: Objecao[]
  total: number
  principal: string
}

export interface TagPerformance {
  id: string
  nome: string
  cor: string
  quantidade: number
  conversao: number
  valorMedio: number
}

export interface TagsPerformanceData {
  tags: TagPerformance[]
  totalUsos: number
}

export interface UTMPerformance {
  source: string
  medium: string
  campaign?: string
  visits: number
  leads: number
  conversao: number
}

export interface UTMPerformanceData {
  utms: UTMPerformance[]
}

// ==========================================
// API Response Types
// ==========================================

export interface DashboardAPIResponse<T> {
  data: T
  meta?: {
    timestamp: string
    cached: boolean
  }
}

export interface DashboardAPIError {
  error: string
  code: string
  details?: Record<string, unknown>
}
