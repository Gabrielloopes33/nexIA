/**
 * AI Objection Detector
 * Detecta objeções em transcrições de calls usando keywords em português
 * 5 categorias: Preço, Timing, Concorrência, Features, Autoridade
 */

export type ObjectionCategory = 
  | 'Preço'
  | 'Timing'
  | 'Concorrência'
  | 'Features'
  | 'Autoridade'

export interface Objection {
  category: ObjectionCategory
  text: string
  confidence: number // 0-1
  timestamp?: string // HH:MM no call
}

export interface ObjectionStats {
  category: ObjectionCategory
  count: number
  conversionRate: number // 0-100
  averageResolutionTime: number // dias
  examples: string[]
}

/**
 * Keywords por categoria de objeção
 * Baseado em pesquisa de objeções comuns no mercado brasileiro B2B
 */
const OBJECTION_KEYWORDS: Record<ObjectionCategory, string[]> = {
  'Preço': [
    'caro',
    'preço alto',
    'muito caro',
    'não tenho orçamento',
    'não cabe no orçamento',
    'não temos verba',
    'está fora do orçamento',
    'muito investimento',
    'investimento alto',
    'preciso de desconto',
    'tem desconto',
    'valor elevado',
    'acima do esperado'
  ],
  
  'Timing': [
    'não é o momento',
    'não é agora',
    'talvez depois',
    'mais tarde',
    'próximo ano',
    'próximo trimestre',
    'próximo mês',
    'ainda não',
    'preciso pensar',
    'vou pensar',
    'deixa eu ver',
    'vou avaliar'
  ],
  
  'Concorrência': [
    'já temos outro',
    'já usamos',
    'usando concorrente',
    'comparando opções',
    'vendo outras',
    'outras empresas',
    'outros fornecedores',
    'fazendo cotação',
    'analisando mercado',
    'pesquisando alternativas'
  ],
  
  'Features': [
    'falta funcionalidade',
    'não tem',
    'não possui',
    'preciso de',
    'precisamos de',
    'não atende',
    'não integra',
    'falta integração',
    'não tem integração',
    'não faz isso',
    'limitado',
    'incompleto'
  ],
  
  'Autoridade': [
    'não sou eu quem decide',
    'não decido sozinho',
    'preciso consultar',
    'falar com',
    'depende do',
    'aprovação do',
    'meu gestor',
    'meu chefe',
    'diretoria',
    'time',
    'equipe decide',
    'decisão conjunta'
  ]
}

/**
 * Detecta objeções em um texto de transcrição
 * Retorna array de objeções encontradas com categoria e confidence
 */
export function detectObjections(text: string): Objection[] {
  const textLower = text.toLowerCase()
  const objections: Objection[] = []
  
  // Verifica cada categoria
  for (const [category, keywords] of Object.entries(OBJECTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        // Extrai contexto ao redor da keyword (50 chars antes e depois)
        const index = textLower.indexOf(keyword.toLowerCase())
        const start = Math.max(0, index - 50)
        const end = Math.min(text.length, index + keyword.length + 50)
        const context = text.substring(start, end).trim()
        
        // Calcula confidence baseado na proximidade com outras keywords
        let confidence = 0.7
        const nearbyMatches = keywords.filter(k => 
          k !== keyword && textLower.includes(k.toLowerCase())
        ).length
        confidence = Math.min(0.95, 0.7 + (nearbyMatches * 0.05))
        
        objections.push({
          category: category as ObjectionCategory,
          text: context,
          confidence
        })
        
        // Quebra após primeira match na categoria para não duplicar
        break
      }
    }
  }
  
  return objections
}

/**
 * Calcula estatísticas agregadas de objeções
 * Usado para gráficos e insights
 */
export function calculateObjectionStats(
  transcriptions: Array<{
    objections: Objection[]
    converted: boolean
    resolutionDays?: number
  }>
): ObjectionStats[] {
  const statsByCategory = new Map<ObjectionCategory, {
    count: number
    conversions: number
    resolutionDays: number[]
    examples: Set<string>
  }>()
  
  // Inicializa todas as categorias
  const categories: ObjectionCategory[] = [
    'Preço',
    'Timing', 
    'Concorrência',
    'Features',
    'Autoridade'
  ]
  
  categories.forEach(cat => {
    statsByCategory.set(cat, {
      count: 0,
      conversions: 0,
      resolutionDays: [],
      examples: new Set()
    })
  })
  
  // Processa transcrições
  transcriptions.forEach(t => {
    t.objections.forEach(obj => {
      const stats = statsByCategory.get(obj.category)!
      stats.count++
      
      if (t.converted) {
        stats.conversions++
      }
      
      if (t.resolutionDays) {
        stats.resolutionDays.push(t.resolutionDays)
      }
      
      // Adiciona exemplo (máximo 3 por categoria)
      if (stats.examples.size < 3) {
        stats.examples.add(obj.text)
      }
    })
  })
  
  // Converte para array de ObjectionStats
  return categories.map(category => {
    const stats = statsByCategory.get(category)!
    
    return {
      category,
      count: stats.count,
      conversionRate: stats.count > 0 
        ? (stats.conversions / stats.count) * 100 
        : 0,
      averageResolutionTime: stats.resolutionDays.length > 0
        ? stats.resolutionDays.reduce((a, b) => a + b, 0) / stats.resolutionDays.length
        : 0,
      examples: Array.from(stats.examples)
    }
  }).filter(s => s.count > 0) // Remove categorias sem objeções
    .sort((a, b) => b.count - a.count) // Ordena por frequência
}

/**
 * Extrai sentimento geral de uma transcrição
 * Retorna 'positive' | 'neutral' | 'negative' e score 0-100
 */
export function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
} {
  const textLower = text.toLowerCase()
  
  const positiveKeywords = [
    'ótimo', 'perfeito', 'adorei', 'excelente', 'concordo',
    'vamos fechar', 'me convenceu', 'gostei', 'interessante',
    'faz sentido', 'combina', 'resolve', 'solução', 'ideal'
  ]
  
  const negativeKeywords = [
    'caro', 'não tenho', 'preciso pensar', 'talvez',
    'não é o momento', 'muito investimento', 'não convence',
    'difícil', 'complicado', 'problema', 'não atende'
  ]
  
  let positiveCount = 0
  let negativeCount = 0
  
  positiveKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) positiveCount++
  })
  
  negativeKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) negativeCount++
  })
  
  const balance = positiveCount - negativeCount
  const score = Math.max(0, Math.min(100, 50 + (balance * 10)))
  
  let sentiment: 'positive' | 'neutral' | 'negative'
  if (score >= 60) sentiment = 'positive'
  else if (score >= 40) sentiment = 'neutral'
  else sentiment = 'negative'
  
  return { sentiment, score }
}
