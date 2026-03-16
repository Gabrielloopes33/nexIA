// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports

export interface Lead {
  id: string
  nome: string
  email: string
  telefone: string
  empresa?: string
  status: string
  origem: string
  score: number
  criadoEm: string
}

export const MOCK_LEADS_ENRICHED: Lead[] = []

export const ENRICHED_LEADS: Lead[] = []
