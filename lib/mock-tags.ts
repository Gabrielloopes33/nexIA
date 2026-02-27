/**
 * Mock Tags Database
 * 30 tags predefinidas cobrindo 6 categorias para o sistema de CRM
 */

import type { Tag, TagCategory, TagColor } from './types/tag'

/**
 * Helper para criar tag mock
 */
function createMockTag(
  id: number,
  name: string,
  category: TagCategory,
  color: TagColor,
  usageCount: number = 0
): Tag {
  return {
    id: `tag-${id}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    color,
    category,
    createdAt: new Date(2025, 0, 1 + id), // Espaça as datas de criação
    createdBy: 'system',
    usageCount
  }
}

/**
 * LEAD SOURCE (Origem do Lead) - 6 tags
 * Principais canais de aquisição
 */
const LEAD_SOURCE_TAGS: Tag[] = [
  createMockTag(1, 'Google Ads', 'lead_source', 'blue', 234),
  createMockTag(2, 'LinkedIn', 'lead_source', 'blue', 189),
  createMockTag(3, 'Indicação', 'lead_source', 'green', 156),
  createMockTag(4, 'Orgânico', 'lead_source', 'green', 298),
  createMockTag(5, 'Instagram', 'lead_source', 'pink', 87),
  createMockTag(6, 'WhatsApp', 'lead_source', 'green', 142),
]

/**
 * INDUSTRY (Indústria) - 6 tags
 * Principais setores B2B
 */
const INDUSTRY_TAGS: Tag[] = [
  createMockTag(7, 'SaaS', 'industry', 'purple', 178),
  createMockTag(8, 'E-commerce', 'industry', 'orange', 134),
  createMockTag(9, 'Educação', 'industry', 'blue', 98),
  createMockTag(10, 'Saúde', 'industry', 'red', 76),
  createMockTag(11, 'Financeiro', 'industry', 'yellow', 112),
  createMockTag(12, 'Consultoria', 'industry', 'gray', 89),
]

/**
 * PRODUCT INTEREST (Interesse em Produto) - 6 tags
 * Indicadores de intenção de compra
 */
const PRODUCT_INTEREST_TAGS: Tag[] = [
  createMockTag(13, 'Demo Solicitada', 'product_interest', 'green', 145),
  createMockTag(14, 'Trial Ativo', 'product_interest', 'purple', 89),
  createMockTag(15, 'Página de Preços', 'product_interest', 'yellow', 267),
  createMockTag(16, 'Case Study', 'product_interest', 'blue', 123),
  createMockTag(17, 'Integração', 'product_interest', 'purple', 78),
  createMockTag(18, 'Documentação', 'product_interest', 'gray', 56),
]

/**
 * CAMPAIGN (Campanha) - 4 tags
 * Campanhas de marketing ativas
 */
const CAMPAIGN_TAGS: Tag[] = [
  createMockTag(19, 'Black Friday 2026', 'campaign', 'orange', 234),
  createMockTag(20, 'Webinar Q1', 'campaign', 'blue', 156),
  createMockTag(21, 'Lançamento Produto', 'campaign', 'purple', 98),
  createMockTag(22, 'Email Nurture', 'campaign', 'gray', 445),
]

/**
 * LIFECYCLE STAGE (Estágio do Ciclo) - 5 tags
 * Posição do lead no funil
 */
const LIFECYCLE_TAGS: Tag[] = [
  createMockTag(23, 'Novo', 'lifecycle_stage', 'blue', 342),
  createMockTag(24, 'Engajamento Baixo', 'lifecycle_stage', 'gray', 123),
  createMockTag(25, 'Engajamento Alto', 'lifecycle_stage', 'green', 187),
  createMockTag(26, 'Qualificado', 'lifecycle_stage', 'green', 98),
  createMockTag(27, 'Cliente', 'lifecycle_stage', 'purple', 156),
]

/**
 * CUSTOM (Personalizado) - 5 tags
 * Tags especiais para segmentação avançada
 */
const CUSTOM_TAGS: Tag[] = [
  createMockTag(28, 'VIP', 'custom', 'yellow', 45),
  createMockTag(29, 'Decisor', 'custom', 'orange', 89),
  createMockTag(30, 'C-Level', 'custom', 'red', 67),
  createMockTag(31, 'Orçamento Aprovado', 'custom', 'green', 34),
  createMockTag(32, 'Urgente', 'custom', 'red', 56),
]

/**
 * Database completo de tags (32 tags)
 * Exportação principal para uso no sistema
 */
export const MOCK_TAGS: Tag[] = [
  ...LEAD_SOURCE_TAGS,
  ...INDUSTRY_TAGS,
  ...PRODUCT_INTEREST_TAGS,
  ...CAMPAIGN_TAGS,
  ...LIFECYCLE_TAGS,
  ...CUSTOM_TAGS,
]

/**
 * Tags mais populares (top 10 por usageCount)
 * Para uso em quick selectors
 */
export const POPULAR_TAGS = [...MOCK_TAGS]
  .sort((a, b) => b.usageCount - a.usageCount)
  .slice(0, 10)

/**
 * Tags por categoria
 * Para organização em dropdowns
 */
export const TAGS_BY_CATEGORY: Record<TagCategory, Tag[]> = {
  lead_source: LEAD_SOURCE_TAGS,
  industry: INDUSTRY_TAGS,
  product_interest: PRODUCT_INTEREST_TAGS,
  campaign: CAMPAIGN_TAGS,
  lifecycle_stage: LIFECYCLE_TAGS,
  custom: CUSTOM_TAGS,
}

/**
 * Helper: Buscar tag por ID
 */
export function getTagById(id: string): Tag | undefined {
  return MOCK_TAGS.find(tag => tag.id === id)
}

/**
 * Helper: Buscar tag por nome
 */
export function getTagByName(name: string): Tag | undefined {
  return MOCK_TAGS.find(tag => tag.name.toLowerCase() === name.toLowerCase())
}

/**
 * Helper: Buscar tags por categoria
 */
export function getTagsByCategory(category: TagCategory): Tag[] {
  return TAGS_BY_CATEGORY[category] || []
}

/**
 * Helper: Buscar tags por cor
 */
export function getTagsByColor(color: TagColor): Tag[] {
  return MOCK_TAGS.filter(tag => tag.color === color)
}

/**
 * Helper: Buscar tags por texto (nome ou slug)
 */
export function searchTags(query: string): Tag[] {
  const lowerQuery = query.toLowerCase()
  return MOCK_TAGS.filter(tag => 
    tag.name.toLowerCase().includes(lowerQuery) ||
    tag.slug.includes(lowerQuery)
  )
}
