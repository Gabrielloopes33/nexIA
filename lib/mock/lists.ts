// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports to use @/hooks/use-lists

export interface ContactList {
  id: string
  nome: string
  descricao?: string
  cor: string
  contatosCount: number
  contatosIds: string[]
  criadoEm: string
  atualizadoEm: string
  criadoPor: string
}

export const MOCK_LISTS: ContactList[] = []

export const LIST_COLORS = [
  "#46347F",
  "#7b79c4",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
]
