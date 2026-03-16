/**
 * Utility functions for formatting dashboard values
 */

/**
 * Formata número com separadores de milhar (pt-BR)
 * @example formatNumber(1000) -> "1.000"
 * @example formatNumber(1500000) -> "1.500.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata valor como moeda BRL
 * @example formatCurrency(1000) -> "R$ 1.000,00"
 * @example formatCurrency(1500.50) -> "R$ 1.500,50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata valor como percentual
 * @example formatPercentage(25) -> "25,0%"
 * @example formatPercentage(12.5) -> "12,5%"
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Formata duração em dias (ou horas se < 1 dia)
 * @example formatDuration(5) -> "5 dias"
 * @example formatDuration(0.5) -> "12h"
 * @example formatDuration(1) -> "1 dia"
 */
export function formatDuration(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days === 1) {
    return '1 dia';
  }
  return `${Math.round(days)} dias`;
}

/**
 * Formata data para exibição
 * @example formatDate('2024-03-13') -> "13/03/2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata data curta (mês/ano)
 * @example formatShortDate('2024-03-13') -> "03/2024"
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Trunca texto com reticências
 * @example truncate('Hello World', 8) -> "Hello..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Converte minutos em string legível
 * @example formatMinutes(90) -> "1h 30min"
 * @example formatMinutes(45) -> "45min"
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}
