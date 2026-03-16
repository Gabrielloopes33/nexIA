// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports to use @/hooks/use-contacts

export interface TrashedContact {
  id: string
  nome: string
  sobrenome: string
  email: string
  empresa: string
  excluidoEm: string
  excluidoPor: string
  expiracaoEm: string
  avatar?: string
  avatarBg?: string
}

export const MOCK_TRASHED_CONTACTS: TrashedContact[] = []

export function calcularDiasRestantes(expiracaoEm: string): number {
  const expiration = new Date(expiracaoEm)
  const now = new Date()
  const diff = expiration.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
