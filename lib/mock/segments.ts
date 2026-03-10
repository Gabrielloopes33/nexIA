import type { Contact } from "./contacts"

export type RuleField = "status" | "origem" | "tags" | "cidade" | "estado" | "empresa"
export type RuleOperator = "equals" | "not_equals" | "contains" | "greater_than" | "less_than"

export interface SegmentRule {
  id: string
  field: RuleField
  operator: RuleOperator
  value: string | number
}

export interface Segment {
  id: string
  nome: string
  descricao?: string
  cor: string
  regras: SegmentRule[]
  operador: "AND" | "OR"
  contatosCount: number
  criadoEm: string
  atualizadoEm: string
}

export const RULE_FIELDS: { value: RuleField; label: string }[] = [
  { value: "status", label: "Status" },

  { value: "origem", label: "Origem" },
  { value: "tags", label: "Tags" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado" },
  { value: "empresa", label: "Empresa" },
]

export const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: "equals", label: "é igual a" },
  { value: "not_equals", label: "não é igual a" },
  { value: "contains", label: "contém" },
  { value: "greater_than", label: "maior que" },
  { value: "less_than", label: "menor que" },
]

export const MOCK_SEGMENTS: Segment[] = [
  {
    id: "seg-002",
    nome: "Clientes SP",
    descricao: "Contatos localizados em São Paulo",
    cor: "#46347F",
    regras: [
      { id: "rule-002", field: "estado", operator: "equals", value: "SP" },
    ],
    operador: "AND",
    contatosCount: 4,
    criadoEm: "2024-11-15T09:30:00Z",
    atualizadoEm: "2025-01-20T11:15:00Z",
  },
  {
    id: "seg-003",
    nome: "Inativos",
    descricao: "Contatos que não demonstraram engajamento recente",
    cor: "#46347F",
    regras: [
      { id: "rule-003", field: "status", operator: "equals", value: "inativo" },
    ],
    operador: "AND",
    contatosCount: 1,
    criadoEm: "2024-10-20T14:00:00Z",
    atualizadoEm: "2024-12-10T16:30:00Z",
  },
  {
    id: "seg-004",
    nome: "Alta Conversão",
    descricao: "Contatos que já se tornaram clientes",
    cor: "#81C784",
    regras: [
      { id: "rule-004", field: "status", operator: "equals", value: "convertido" },
    ],
    operador: "AND",
    contatosCount: 1,
    criadoEm: "2024-09-05T08:15:00Z",
    atualizadoEm: "2025-01-15T10:00:00Z",
  },
  {
    id: "seg-005",
    nome: "Leads do Instagram",
    descricao: "Contatos originados do Instagram",
    cor: "#BA68C8",
    regras: [
      { id: "rule-005", field: "origem", operator: "contains", value: "Instagram" },
    ],
    operador: "AND",
    contatosCount: 0,
    criadoEm: "2025-01-10T11:30:00Z",
    atualizadoEm: "2025-02-20T09:45:00Z",
  },
]

export const SEGMENT_COLORS = [
  "#46347F",
  "#46347F",
  "#E57373",
  "#81C784",
  "#64B5F6",
  "#FFB74D",
  "#BA68C8",
  "#4DB6AC",
]

export function evaluateContact(
  contact: Contact,
  rules: SegmentRule[],
  operator: "AND" | "OR"
): boolean {
  if (rules.length === 0) return false

  const results = rules.map((rule) => evaluateRule(contact, rule))

  if (operator === "AND") {
    return results.every((r) => r)
  } else {
    return results.some((r) => r)
  }
}

function evaluateRule(contact: Contact, rule: SegmentRule): boolean {
  const contactValue = getContactFieldValue(contact, rule.field)
  const ruleValue = rule.value

  if (contactValue === undefined || contactValue === null) return false

  switch (rule.operator) {
    case "equals":
      return String(contactValue).toLowerCase() === String(ruleValue).toLowerCase()
    case "not_equals":
      return String(contactValue).toLowerCase() !== String(ruleValue).toLowerCase()
    case "contains":
      return String(contactValue).toLowerCase().includes(String(ruleValue).toLowerCase())
    case "greater_than":
      return Number(contactValue) > Number(ruleValue)
    case "less_than":
      return Number(contactValue) < Number(ruleValue)
    default:
      return false
  }
}

function getContactFieldValue(contact: Contact, field: RuleField): string | number | undefined {
  switch (field) {
    case "status":
      return contact.status
    case "origem":
      return contact.origem
    case "tags":
      return contact.tags?.join(", ") || ""
    case "cidade":
      return contact.cidade
    case "estado":
      return contact.estado
    case "empresa":
      return contact.empresa
    default:
      return undefined
  }
}
