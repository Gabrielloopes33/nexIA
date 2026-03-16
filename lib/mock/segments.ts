// TEMPORARY: This file provides compatibility during migration to real API
// TODO: Remove this file and update all imports

export type RuleField = "nome" | "email" | "telefone" | "status" | "tags" | "origem"
export type RuleOperator = "equals" | "contains" | "startsWith" | "endsWith" | "notEquals"

export interface SegmentRule {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string
}

export interface Segment {
  id: string
  nome: string
  descricao?: string
  cor: string
  operador: "AND" | "OR"
  regras: SegmentRule[]
  contatosCount: number
  criadoEm: string
  atualizadoEm: string
}

export const MOCK_SEGMENTS: Segment[] = []

export const SEGMENT_COLORS = [
  "#46347F",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
]

export const RULE_FIELDS = [
  { value: "nome", label: "Nome" },
  { value: "email", label: "Email" },
  { value: "telefone", label: "Telefone" },
  { value: "status", label: "Status" },
  { value: "tags", label: "Tags" },
  { value: "origem", label: "Origem" },
]

export const RULE_OPERATORS = [
  { value: "equals", label: "é igual a" },
  { value: "contains", label: "contém" },
  { value: "startsWith", label: "começa com" },
  { value: "endsWith", label: "termina com" },
  { value: "notEquals", label: "não é igual a" },
]

export function evaluateContact(contact: any, rules: SegmentRule[], operator: "AND" | "OR"): boolean {
  if (rules.length === 0) return false
  
  const results = rules.map(rule => {
    const contactValue = contact[rule.field] || ""
    const ruleValue = rule.value.toLowerCase()
    const contactValStr = String(contactValue).toLowerCase()
    
    switch (rule.operator) {
      case "equals": return contactValStr === ruleValue
      case "contains": return contactValStr.includes(ruleValue)
      case "startsWith": return contactValStr.startsWith(ruleValue)
      case "endsWith": return contactValStr.endsWith(ruleValue)
      case "notEquals": return contactValStr !== ruleValue
      default: return false
    }
  })
  
  return operator === "AND" ? results.every(r => r) : results.some(r => r)
}
