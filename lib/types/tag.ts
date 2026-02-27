/**
 * Tag System Types
 * Sistema completo de tags para CRM com suporte a UTM tracking e AI
 */

/**
 * Cores disponíveis para tags
 * 8 opções cobrindo todo espectro de categorização
 */
export type TagColor = 
  | "blue"    // Confiança, profissional (empresas SaaS, tech)
  | "green"   // Sucesso, crescimento (indicações, qualificados)
  | "yellow"  // Atenção, VIP (página de preços, high-value)
  | "orange"  // Energia, urgência (campanhas, promoções)
  | "red"     // Prioridade alta (C-level, enterprise)
  | "purple"  // Premium, exclusivo (trial ativo, demos)
  | "pink"    // Social, criativo (mídias sociais)
  | "gray"    // Neutro, informacional (lifecycle stages)

/**
 * Categorias de tags para organização
 * Define o propósito e agrupamento das tags
 */
export type TagCategory = 
  | "lead_source"      // Origem do lead (Google Ads, LinkedIn, Indicação)
  | "industry"         // Indústria/setor (SaaS, E-commerce, Educação)
  | "product_interest" // Interesse em produto (Demo, Trial, Pricing)
  | "campaign"         // Campanha de marketing (Black Friday, Webinar Q1)
  | "lifecycle_stage"  // Estágio no ciclo (Novo, Engajado, Qualificado)
  | "custom"           // Tags customizadas pelo usuário

/**
 * Interface principal de Tag
 * Representa uma tag individual no sistema
 */
export interface Tag {
  /** ID único da tag */
  id: string
  /** Nome legível da tag */
  name: string
  /** Slug URL-friendly (lowercase, hífens) */
  slug: string
  /** Cor visual da tag */
  color: TagColor
  /** Categoria de organização */
  category: TagCategory
  /** Data de criação */
  createdAt: Date
  /** ID do usuário que criou */
  createdBy: string
  /** Quantos contatos têm esta tag */
  usageCount: number
}

/**
 * Parâmetros UTM padrão
 * Tracking de origem de tráfego e campanhas
 */
export interface UTMParams {
  /** Origem do tráfego (google, linkedin, email, direct) */
  utm_source: string
  /** Meio/canal (cpc, paid_social, email, organic) */
  utm_medium: string
  /** Nome da campanha (black-friday-2026, webinar-q1) */
  utm_campaign?: string
  /** Variação do conteúdo (ad-variant-a, cta-button) */
  utm_content?: string
  /** Termo de busca (automation software, crm tool) */
  utm_term?: string
}

/**
 * Ponto de contato com UTM
 * Registra cada visita do lead com contexto completo
 */
export interface UTMTouchpoint extends UTMParams {
  /** Timestamp da visita */
  timestamp: Date
  /** Página de entrada (URL path) */
  landingPage: string
}

/**
 * Filtro de tags para consultas
 * Suporta lógica AND/OR e exclusões
 */
export interface TagFilter {
  /** Modo de combinação: AND (todos) ou OR (qualquer) */
  mode: "AND" | "OR"
  /** IDs das tags a incluir */
  include: string[]
  /** IDs das tags a excluir (opcional) */
  exclude?: string[]
}

/**
 * Métricas de performance por tag
 * Analytics de efetividade de cada tag
 */
export interface TagPerformance {
  /** Nome da tag */
  tagName: string
  /** Número total de leads com esta tag */
  leadsCount: number
  /** Número de conversões (deals fechados) */
  conversionsCount: number
  /** Taxa de conversão (0-1) */
  conversionRate: number
  /** Ticket médio dos deals desta tag */
  averageDealValue: number
  /** Ciclo de vendas médio em dias */
  averageSalesCycle: number
  /** ROI calculado (Revenue / Cost) */
  roi: number
}

/**
 * Modelo de atribuição UTM
 * Define como distribuir crédito entre touchpoints
 */
export type AttributionModel = 
  | "first-touch"  // 100% crédito ao primeiro touchpoint
  | "last-touch"   // 100% crédito ao último touchpoint
  | "linear"       // Crédito igual para todos
  | "u-shaped"     // 40% primeiro, 40% último, 20% meio
  | "time-decay"   // Mais recente = mais crédito

/**
 * Crédito de atribuição por touchpoint
 * Resultado do cálculo de atribuição
 */
export interface AttributionCredit {
  /** Touchpoint que recebe crédito */
  touchpoint: UTMTouchpoint
  /** Porcentagem de crédito (0-1) */
  credit: number
}

/**
 * Extensão do Contact com campos de Tags e AI
 * Adiciona capacidades avançadas ao contato base
 */
export interface ContactTagsExtension {
  /** Tags manuais aplicadas */
  tags: string[]
  /** Tags sugeridas por IA (não confirmadas) */
  autoTags?: string[]
  
  /** Primeiro touchpoint (atribuição) */
  firstTouch?: UTMTouchpoint
  /** Último touchpoint (atribuição) */
  lastTouch?: UTMTouchpoint
  /** Histórico completo de touchpoints */
  touchpoints?: UTMTouchpoint[]
  
  /** Lead score calculado (0-100) */
  leadScore?: number
  /** Grade de qualidade (A/B/C/D) */
  leadGrade?: 'A' | 'B' | 'C' | 'D'
  /** Sentimento detectado em conversas */
  sentiment?: 'positive' | 'neutral' | 'negative'
  /** Score de sentimento (0-100) */
  sentimentScore?: number
}

/**
 * Mapeamento de cores para UI
 * Define classes Tailwind para cada cor de tag
 */
export const TAG_COLOR_MAP: Record<TagColor, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300'
  }
}

/**
 * Labels em Português para categorias
 */
export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  lead_source: 'Origem do Lead',
  industry: 'Indústria',
  product_interest: 'Interesse em Produto',
  campaign: 'Campanha',
  lifecycle_stage: 'Estágio',
  custom: 'Personalizado'
}
