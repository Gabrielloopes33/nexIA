// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports to use @/hooks/use-contacts

export type ContactStatus = "ativo" | "inativo" | "aguardando"
export type ContactSource = "LinkedIn" | "Manual" | "Import" | "API"

export interface Contact {
  id: string
  nome: string
  sobrenome: string
  email: string
  telefone?: string
  empresa: string
  cargo?: string
  cidade?: string
  estado?: string
  status: ContactStatus
  origem: string
  avatar: string
  avatarBg?: string
  tags: string[]
  criadoEm: string
  atualizadoEm: string
  atualizadoPor: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  instagram?: string
  linkedin?: string
}

export const MOCK_CONTACTS: Contact[] = []

export const CONTACT_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "#10b981" },
  { value: "inativo", label: "Inativo", color: "#6b7280" },
  { value: "aguardando", label: "Aguardando", color: "#f59e0b" },
]

export function getContactTags(contact: Contact) {
  return []
}
