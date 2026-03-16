// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports to use @/hooks/use-tags

export interface Tag {
  id: string
  nome: string
  cor: string
  contatosCount: number
  automatizacao?: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: string
  updatedAt: string
}

export const MOCK_TAGS: Tag[] = []

export const UTM_SOURCES = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "direct", label: "Direto" },
]

export const UTM_MEDIUMS = [
  { value: "organic", label: "Orgânico" },
  { value: "paid", label: "Pago" },
  { value: "social", label: "Social" },
  { value: "email", label: "Email" },
]

export function getTagById(id: string): Tag | undefined {
  return undefined
}

export function getTagsByIds(ids: string[]): Tag[] {
  return []
}
