/**
 * Brazilian Locale Formatters
 * Funções de formatação para números, moeda, percentuais, datas e duração
 * Seguindo padrões brasileiros (pt-BR)
 */

/**
 * Formata valor monetário em Real (BRL)
 * @example formatCurrency(5420.50) // "R$ 5.420,50"
 * @example formatCurrency(245600) // "R$ 245.600,00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata percentual com vírgula decimal
 * @example formatPercentage(3.8) // "3,8%"
 * @example formatPercentage(86.5, 1) // "86,5%"
 * @example formatPercentage(100, 0) // "100%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`
}

/**
 * Formata número com separadores brasileiros
 * @example formatNumber(1234) // "1.234"
 * @example formatNumber(1234.56, 2) // "1.234,56"
 * @example formatNumber(5420.5, 0) // "5.420"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formata duração em texto legível
 * @example formatDuration(1, 'days') // "1 dia"
 * @example formatDuration(18, 'days') // "18 dias"
 * @example formatDuration(2.5, 'hours') // "2h 30min"
 * @example formatDuration(45, 'minutes') // "45 min"
 */
export function formatDuration(
  value: number, 
  unit: 'days' | 'hours' | 'minutes'
): string {
  if (unit === 'days') {
    return `${Math.round(value)} ${value === 1 ? 'dia' : 'dias'}`
  }
  
  if (unit === 'hours') {
    const hours = Math.floor(value)
    const minutes = Math.round((value - hours) * 60)
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }
  
  // minutes
  return `${Math.round(value)} min`
}

/**
 * Formata data em formato brasileiro DD/MM/YYYY
 * @example formatDate(new Date('2026-02-26')) // "26/02/2026"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

/**
 * Formata hora em formato HH:mm
 * @example formatTime(new Date('2026-02-26T14:30')) // "14:30"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formata data/hora completo
 * @example formatDateTime(new Date('2026-02-26T14:30')) // "26/02/2026 às 14:30"
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} às ${formatTime(date)}`
}

/**
 * Formata data relativa (hoje, ontem, há X dias)
 * @example formatRelativeDate(new Date()) // "Hoje"
 * @example formatRelativeDate(yesterday) // "Ontem"
 * @example formatRelativeDate(threeDaysAgo) // "Há 3 dias"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays <= 7) return `Há ${diffDays} dias`
  
  if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  }
  
  if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30)
    return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  
  return formatDate(date)
}

/**
 * Formata número abreviado (K, M)
 * @example formatAbbreviated(1234) // "1,2K"
 * @example formatAbbreviated(340000) // "340K"
 * @example formatAbbreviated(1200000) // "1,2M"
 */
export function formatAbbreviated(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}M`
  }
  
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}K`
  }
  
  return value.toString()
}

/**
 * Formata score de 0-100 com badge colorido
 * @example formatScore(85) // { value: "85", grade: "A", color: "green" }
 * @example formatScore(68) // { value: "68", grade: "B", color: "blue" }
 */
export function formatScore(score: number): {
  value: string
  grade: 'A' | 'B' | 'C' | 'D'
  color: 'green' | 'blue' | 'yellow' | 'red'
} {
  const grade = 
    score >= 80 ? 'A' :
    score >= 60 ? 'B' :
    score >= 40 ? 'C' : 'D'
  
  const color = 
    grade === 'A' ? 'green' :
    grade === 'B' ? 'blue' :
    grade === 'C' ? 'yellow' : 'red'
  
  return {
    value: Math.round(score).toString(),
    grade,
    color
  }
}

/**
 * Formata variação com sinal e cor
 * @example formatChange(12.5) // { value: "+12,5%", trend: "up", color: "green" }
 * @example formatChange(-8.3) // { value: "-8,3%", trend: "down", color: "red" }
 * @example formatChange(0) // { value: "0%", trend: "neutral", color: "gray" }
 */
export function formatChange(value: number, decimals: number = 1): {
  value: string
  trend: 'up' | 'down' | 'neutral'
  color: 'green' | 'red' | 'gray'
} {
  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'
  const color = value > 0 ? 'green' : value < 0 ? 'red' : 'gray'
  
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'always'
  })
  
  return {
    value: `${formatted}%`,
    trend,
    color
  }
}

/**
 * Formata intervalo de tempo
 * @example formatTimeRange(new Date('2026-01-01'), new Date('2026-01-31')) // "1 a 31 de Jan 2026"
 */
export function formatTimeRange(startDate: Date, endDate: Date): string {
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  
  // Se mesmo mês
  if (startDate.getMonth() === endDate.getMonth() && 
      startDate.getFullYear() === endDate.getFullYear()) {
    const month = startDate.toLocaleDateString('pt-BR', { month: 'short' })
    const year = startDate.getFullYear()
    return `${startDate.getDate()} a ${endDate.getDate()} de ${month} ${year}`
  }
  
  return `${start} a ${end}`
}

/**
 * Formata lista de nomes com vírgula e "e"
 * @example formatList(['João', 'Maria', 'Pedro']) // "João, Maria e Pedro"
 * @example formatList(['Ana', 'Carlos']) // "Ana e Carlos"
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} e ${items[1]}`
  
  const lastItem = items[items.length - 1]
  const otherItems = items.slice(0, -1)
  
  return `${otherItems.join(', ')} e ${lastItem}`
}
