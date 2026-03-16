// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports

export type FieldType = "texto" | "numero" | "data" | "selecao" | "booleano" | "url"

export interface CustomField {
  id: string
  nome: string
  label: string
  tipo: FieldType
  obrigatorio: boolean
  descricao?: string
  opcoes?: string[]
  ordem: number
  criadoEm: string
}

export const MOCK_CUSTOM_FIELDS: CustomField[] = []

export const DEFAULT_FIELDS: Omit<CustomField, 'id' | 'criadoEm'>[] = [
  { nome: "nome", label: "Nome", tipo: "texto", obrigatorio: true, descricao: "Nome do contato", ordem: 1 },
  { nome: "email", label: "Email", tipo: "texto", obrigatorio: true, descricao: "Email principal", ordem: 2 },
  { nome: "telefone", label: "Telefone", tipo: "texto", obrigatorio: false, descricao: "Número de telefone", ordem: 3 },
  { nome: "empresa", label: "Empresa", tipo: "texto", obrigatorio: false, descricao: "Nome da empresa", ordem: 4 },
]

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  texto: "Texto",
  numero: "Número",
  data: "Data",
  selecao: "Seleção",
  booleano: "Sim/Não",
  url: "URL",
}

export const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  texto: "#46347F",
  numero: "#10b981",
  data: "#f59e0b",
  selecao: "#8b5cf6",
  booleano: "#3b82f6",
  url: "#06b6d4",
}

export const FIELD_TYPES: FieldType[] = ["texto", "numero", "data", "selecao", "booleano", "url"]
