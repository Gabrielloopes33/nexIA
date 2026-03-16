/**
 * Central de Query Keys para Dashboard
 * 
 * Organização hierárquica para invalidação eficiente
 * Regra: Quanto mais específico, mais segmentos na key
 */

export const dashboardKeys = {
  // Base key
  all: ['dashboard'] as const,
  
  // Filtros globais
  filters: () => [...dashboardKeys.all, 'filters'] as const,
  
  // Cards específicos - KPIs
  metricasKPI: (period: string) => 
    [...dashboardKeys.all, 'kpis', period] as const,
  
  // Cards específicos - Funil
  funilPorEtapa: (period: string) => 
    [...dashboardKeys.all, 'funil', 'por-etapa', period] as const,
  funilConversao: (period: string) => 
    [...dashboardKeys.all, 'funil', 'conversao', period] as const,
  
  // Cards específicos - Leads
  leadsRecentes: (period: string, limit: number = 5) => 
    [...dashboardKeys.all, 'leads', 'recentes', period, limit] as const,
  leadsTendencias: (period: string) => 
    [...dashboardKeys.all, 'leads', 'tendencias', period] as const,
  
  // Cards específicos - Conversas
  conversasVolume: (period: string) => 
    [...dashboardKeys.all, 'conversas', 'volume', period] as const,
  conversasAtividade: (period: string) => 
    [...dashboardKeys.all, 'conversas', 'atividade', period] as const,
  
  // Cards específicos - Performance
  objecoes: (period: string) => 
    [...dashboardKeys.all, 'performance', 'objecoes', period] as const,
  tagsPerformance: (period: string) => 
    [...dashboardKeys.all, 'performance', 'tags', period] as const,
  utmPerformance: (period: string) => 
    [...dashboardKeys.all, 'performance', 'utm', period] as const,
  
  // Invalidação em grupo por período
  byPeriod: (period: string) => 
    [...dashboardKeys.all, { period }] as const,
  
  // Invalidar tudo
  invalidateAll: () => dashboardKeys.all,
} as const

// Query keys para outros domínios (exemplo)
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  detail: (id: string) => [...contactsKeys.all, 'detail', id] as const,
} as const

export const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  detail: (id: string) => [...conversationsKeys.all, 'detail', id] as const,
} as const
