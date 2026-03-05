import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrai iniciais de um nome completo
 * @param name Nome completo
 * @returns Iniciais em maiúsculas (max 2 letras)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Formata número de telefone no padrão brasileiro
 * @param phone Telefone sem formatação
 * @returns Telefone formatado (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  
  return phone
}

/**
 * Formata data no padrão brasileiro
 * @param dateString Data em formato ISO ou string
 * @returns Data formatada DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Formata data relativa (hoje, ontem, X dias atrás)
 * @param dateString Data em formato ISO
 * @returns String relativa
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Ontem"
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`
  return `${Math.floor(diffDays / 365)} anos atrás`
}

/**
 * Gera classes de cor de avatar baseadas em iniciais
 * @param initials Iniciais do nome
 * @returns Classes Tailwind para avatar
 */
export function getAvatarColor(initials: string): string {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  ]
  
  const hash = initials.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * Formata valor monetário em Real Brasileiro
 * @param value Valor numérico
 * @returns String formatada em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
