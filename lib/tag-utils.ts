/**
 * Tag Utilities Library
 * Helper functions para trabalhar com sistema de tags
 */

import type { Tag, TagColor, TagCategory, TagFilter } from './types/tag'
import type { Contact } from './types/contact'
import { MOCK_TAGS } from './mock-tags'

/**
 * Mapa de cores padrão para tags
 */
export const TAG_COLOR_MAP: Record<string, TagColor> = {
  'tag-1': 'blue',
  'tag-2': 'purple',
  'tag-3': 'green',
  'tag-4': 'blue',
  'tag-5': 'pink',
  'tag-6': 'green',
  'tag-7': 'purple',
  'tag-8': 'orange',
  'tag-9': 'blue',
  'tag-10': 'pink',
  'tag-11': 'yellow',
  'tag-12': 'purple',
  'tag-13': 'blue',
  'tag-14': 'green',
  'tag-15': 'purple',
  'tag-16': 'blue',
  'tag-17': 'orange',
  'tag-18': 'pink',
  'tag-19': 'red',
  'tag-20': 'blue',
  'tag-21': 'green',
  'tag-22': 'purple',
  'tag-23': 'gray',
  'tag-24': 'yellow',
  'tag-25': 'green',
  'tag-26': 'blue',
  'tag-27': 'orange',
  'tag-28': 'purple',
  'tag-29': 'blue',
  'tag-30': 'purple',
  'tag-31': 'green',
  'tag-32': 'red'
}

/**
 * Retorna a cor de uma tag pelo ID
 */
export function getTagColor(tagId: string): TagColor {
  return TAG_COLOR_MAP[tagId] || 'gray'
}

/**
 * Busca uma tag pelo ID
 */
export function getTagById(tagId: string): Tag | undefined {
  return MOCK_TAGS.find(tag => tag.id === tagId)
}

/**
 * Busca múltiplas tags pelos IDs
 */
export function getTagsByIds(tagIds: string[]): Tag[] {
  return tagIds
    .map(id => getTagById(id))
    .filter(Boolean) as Tag[]
}

/**
 * Filtra contatos por tags usando lógica AND/OR
 * 
 * @param contacts - Array de contatos
 * @param filter - Filtro de tags com include/exclude/mode
 * @returns Array filtrado de contatos
 */
export function filterContactsByTags(
  contacts: Contact[],
  filter: TagFilter
): Contact[] {
  const { include = [], exclude = [], mode = 'AND' } = filter
  
  return contacts.filter(contact => {
    const contactTags = [...(contact.tags || []), ...(contact.autoTags || [])]
    
    // Aplica filtro de exclusão primeiro
    if (exclude.length > 0) {
      const hasExcludedTag = exclude.some(tagId => contactTags.includes(tagId))
      if (hasExcludedTag) return false
    }
    
    // Se não tem filtro de inclusão, aceita o contato
    if (include.length === 0) return true
    
    // Aplica lógica AND (contato deve ter TODAS as tags)
    if (mode === 'AND') {
      return include.every(tagId => contactTags.includes(tagId))
    }
    
    // Aplica lógica OR (contato deve ter ALGUMA tag)
    return include.some(tagId => contactTags.includes(tagId))
  })
}

/**
 * Interface de performance de tag
 */
export interface TagPerformance {
  tagId: string
  tagName: string
  leadCount: number
  conversionCount: number
  conversionRate: number
  averageDealValue: number
  averageSalesCycle: number
  totalRevenue: number
  roi: number
}

/**
 * Calcula métricas de performance de uma tag
 * 
 * @param contacts - Array de todos os contatos
 * @param tagId - ID da tag a ser analisada
 * @returns Objeto com métricas de performance
 */
export function calculateTagPerformance(
  contacts: Contact[],
  tagId: string
): TagPerformance {
  const tag = getTagById(tagId)
  const tagName = tag?.name || tagId
  
  // Filtra contatos que têm essa tag
  const contactsWithTag = contacts.filter(contact => {
    const contactTags = [...(contact.tags || []), ...(contact.autoTags || [])]
    return contactTags.includes(tagId)
  })
  
  const leadCount = contactsWithTag.length
  
  // Contatos convertidos (receita > 0)
  const converted = contactsWithTag.filter(c => c.receita && c.receita > 0)
  const conversionCount = converted.length
  const conversionRate = leadCount > 0 ? (conversionCount / leadCount) * 100 : 0
  
  // Calcula valores médios para contatos convertidos
  const dealValues = converted
    .map(c => c.receita || 0)
    .filter(v => v > 0)
  
  const averageDealValue = dealValues.length > 0
    ? dealValues.reduce((sum, val) => sum + val, 0) / dealValues.length
    : 0
  
  const totalRevenue = dealValues.reduce((sum, val) => sum + val, 0)
  
  // Ciclo de vendas médio (dias entre criação e conversão)
  const salesCycles = converted
    .filter(c => c.criadoEm && c.atualizadoEm)
    .map(c => {
      const created = new Date(c.criadoEm!).getTime()
      const updated = new Date(c.atualizadoEm!).getTime()
      return Math.floor((updated - created) / (1000 * 60 * 60 * 24))
    })
  
  const averageSalesCycle = salesCycles.length > 0
    ? salesCycles.reduce((sum, days) => sum + days, 0) / salesCycles.length
    : 0
  
  // ROI simplificado (receita / investimento estimado)
  // Para este mock, assumimos investimento de R$ 100 por lead
  const estimatedCost = leadCount * 100
  const roi = estimatedCost > 0 ? (totalRevenue / estimatedCost) : 0
  
  return {
    tagId,
    tagName,
    leadCount,
    conversionCount,
    conversionRate,
    averageDealValue,
    averageSalesCycle,
    totalRevenue,
    roi
  }
}

/**
 * Ordena tags por número de usos (descendente)
 */
export function sortTagsByUsage(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
}

/**
 * Retorna as N tags mais populares
 */
export function getPopularTags(count: number = 10): Tag[] {
  const sorted = sortTagsByUsage(MOCK_TAGS)
  return sorted.slice(0, count)
}

/**
 * Busca tags por nome ou slug (case-insensitive)
 */
export function searchTagsByName(query: string): Tag[] {
  const lowerQuery = query.toLowerCase().trim()
  
  if (!lowerQuery) return MOCK_TAGS
  
  return MOCK_TAGS.filter(tag => {
    const nameMatch = tag.name.toLowerCase().includes(lowerQuery)
    const slugMatch = tag.slug.toLowerCase().includes(lowerQuery)
    
    return nameMatch || slugMatch
  })
}

/**
 * Agrupa tags por categoria
 */
export function groupTagsByCategory(): Record<TagCategory, Tag[]> {
  const grouped: Record<TagCategory, Tag[]> = {
    lead_source: [],
    industry: [],
    product_interest: [],
    campaign: [],
    lifecycle_stage: [],
    custom: []
  }
  
  MOCK_TAGS.forEach(tag => {
    grouped[tag.category].push(tag)
  })
  
  return grouped
}

/**
 * Interface de conflito entre tags
 */
export interface TagConflict {
  tagId: string
  conflictsWith: string[]
  reason: string
}

/**
 * Mapa de tags que não podem coexistir
 */
const TAG_CONFLICTS: Record<string, string[]> = {
  'tag-23': ['tag-24', 'tag-25', 'tag-26', 'tag-27'], // Novo conflita com outros lifecycles
  'tag-24': ['tag-23', 'tag-25', 'tag-26', 'tag-27'], // Engajamento Baixo
  'tag-25': ['tag-23', 'tag-24', 'tag-26', 'tag-27'], // Engajamento Alto
  'tag-26': ['tag-23', 'tag-24', 'tag-25', 'tag-27'], // Qualificado
  'tag-27': ['tag-23', 'tag-24', 'tag-25', 'tag-26'], // Cliente
}

/**
 * Valida se uma combinação de tags tem conflitos
 * 
 * @param tagIds - Array de IDs de tags
 * @returns Objeto com valid (boolean) e lista de conflitos
 */
export function validateTagCombination(tagIds: string[]): {
  valid: boolean
  conflicts: TagConflict[]
} {
  const conflicts: TagConflict[] = []
  
  tagIds.forEach(tagId => {
    const conflictingTags = TAG_CONFLICTS[tagId] || []
    const foundConflicts = conflictingTags.filter(conflictId => 
      tagIds.includes(conflictId)
    )
    
    if (foundConflicts.length > 0) {
      const tag = getTagById(tagId)
      conflicts.push({
        tagId,
        conflictsWith: foundConflicts,
        reason: `"${tag?.name}" não pode coexistir com tags de lifecycle stage conflitantes`
      })
    }
  })
  
  return {
    valid: conflicts.length === 0,
    conflicts
  }
}

/**
 * Sugere tags automaticamente baseado no perfil do contato
 * 
 * @param contact - Contato para análise
 * @returns Array de IDs de tags sugeridas
 */
export function suggestTagsForContact(contact: Contact): string[] {
  const suggestions: string[] = []
  
  // Análise de empresa size
  if (contact.companySize) {
    if (contact.companySize >= 500) {
      suggestions.push('tag-28') // VIP
    }
    if (contact.companySize >= 1000) {
      suggestions.push('tag-20') // Enterprise
    }
  }
  
  // Análise de cargo (C-Level)
  const cLevelTitles = ['CEO', 'CTO', 'CFO', 'COO', 'CIO', 'CMO', 'Chief']
  if (contact.cargo && cLevelTitles.some(title => contact.cargo?.includes(title))) {
    suggestions.push('tag-30') // C-Level
  }
  
  // Análise de cargo (Decisor)
  const decisorTitles = ['Diretor', 'Director', 'VP', 'Gerente', 'Manager', 'Head', 'Sócio', 'Partner', 'Founder']
  if (contact.cargo && decisorTitles.some(title => contact.cargo?.includes(title))) {
    suggestions.push('tag-29') // Decisor
  }
  
  // Análise de engajamento por emailOpens
  if (contact.emailOpens !== undefined) {
    if (contact.emailOpens >= 15) {
      suggestions.push('tag-25') // Engajamento Alto
    } else if (contact.emailOpens <= 5) {
      suggestions.push('tag-24') // Engajamento Baixo
    }
  }
  
  // Análise de receita para Cliente
  if (contact.receita && contact.receita > 0) {
    suggestions.push('tag-27') // Cliente
  }
  
  // Análise de receita para VIP
  if (contact.receita && contact.receita >= 50000) {
    suggestions.push('tag-28') // VIP
  }
  
  // Remove duplicatas e tags que já existem no contato
  const existingTags = [...(contact.tags || []), ...(contact.autoTags || [])]
  return [...new Set(suggestions)].filter(tagId => !existingTags.includes(tagId))
}

/**
 * Retorna tags mais usadas para uma categoria específica
 */
export function getTopTagsByCategory(
  category: TagCategory,
  count: number = 5
): Tag[] {
  const categoryTags = MOCK_TAGS.filter(tag => tag.category === category)
  return sortTagsByUsage(categoryTags).slice(0, count)
}

/**
 * Calcula estatísticas gerais de uso de tags
 */
export function getTagStatistics(contacts: Contact[]): {
  totalTags: number
  totalUsage: number
  averageTagsPerContact: number
  mostUsedTag: Tag | null
  leastUsedTag: Tag | null
} {
  const totalTags = MOCK_TAGS.length
  
  // Conta uso de cada tag nos contatos
  const tagUsage = new Map<string, number>()
  
  contacts.forEach(contact => {
    const contactTags = [...(contact.tags || []), ...(contact.autoTags || [])]
    contactTags.forEach(tagId => {
      tagUsage.set(tagId, (tagUsage.get(tagId) || 0) + 1)
    })
  })
  
  const totalUsage = Array.from(tagUsage.values()).reduce((sum, count) => sum + count, 0)
  const averageTagsPerContact = contacts.length > 0 ? totalUsage / contacts.length : 0
  
  // Encontra tag mais e menos usada
  let mostUsedTag: Tag | null = null
  let leastUsedTag: Tag | null = null
  let maxUsage = 0
  let minUsage = Infinity
  
  tagUsage.forEach((count, tagId) => {
    if (count > maxUsage) {
      maxUsage = count
      mostUsedTag = getTagById(tagId) || null
    }
    if (count < minUsage) {
      minUsage = count
      leastUsedTag = getTagById(tagId) || null
    }
  })
  
  return {
    totalTags,
    totalUsage,
    averageTagsPerContact,
    mostUsedTag,
    leastUsedTag
  }
}










