export type FieldType = "texto" | "numero" | "data" | "selecao" | "booleano" | "url"

export interface CustomField {
  id: string
  nome: string
  label: string
  tipo: FieldType
  obrigatorio: boolean
  opcoes?: string[]
  descricao?: string
  ordem: number
  criadoEm: string
}

export const DEFAULT_FIELDS: { nome: string; label: string; tipo: FieldType; obrigatorio: boolean; descricao: string }[] = [
  { nome: "nome", label: "Nome", tipo: "texto", obrigatorio: true, descricao: "Primeiro nome do contato" },
  { nome: "sobrenome", label: "Sobrenome", tipo: "texto", obrigatorio: true, descricao: "Sobrenome do contato" },
  { nome: "email", label: "E-mail", tipo: "texto", obrigatorio: true, descricao: "Endereço de e-mail principal" },
  { nome: "telefone", label: "Telefone", tipo: "texto", obrigatorio: true, descricao: "Número de telefone com DDD" },
  { nome: "empresa", label: "Empresa", tipo: "texto", obrigatorio: false, descricao: "Nome da empresa" },
  { nome: "cargo", label: "Cargo", tipo: "texto", obrigatorio: false, descricao: "Cargo ou posição" },
  { nome: "cidade", label: "Cidade", tipo: "texto", obrigatorio: false, descricao: "Cidade de localização" },
  { nome: "estado", label: "Estado", tipo: "texto", obrigatorio: false, descricao: "Estado (UF)" },
  { nome: "status", label: "Status", tipo: "selecao", obrigatorio: false, descricao: "Status do contato no CRM" },

  { nome: "origem", label: "Origem", tipo: "texto", obrigatorio: false, descricao: "Canal de origem do contato" },
  { nome: "observacoes", label: "Observações", tipo: "texto", obrigatorio: false, descricao: "Notas e observações gerais" },
]

export const MOCK_CUSTOM_FIELDS: CustomField[] = [
  {
    id: "cf-001",
    nome: "tamanho_da_empresa",
    label: "Tamanho da Empresa",
    tipo: "selecao",
    obrigatorio: false,
    opcoes: ["1-10 funcionários", "11-50 funcionários", "51-200 funcionários", "200+ funcionários"],
    descricao: "Porte da empresa do contato",
    ordem: 1,
    criadoEm: "2025-01-15T10:00:00Z",
  },
  {
    id: "cf-002",
    nome: "data_de_aniversario",
    label: "Data de Aniversário",
    tipo: "data",
    obrigatorio: false,
    descricao: "Data de aniversário do contato",
    ordem: 2,
    criadoEm: "2025-01-20T14:30:00Z",
  },
  {
    id: "cf-003",
    nome: "website",
    label: "Website",
    tipo: "url",
    obrigatorio: false,
    descricao: "Site ou portfólio pessoal",
    ordem: 3,
    criadoEm: "2025-02-01T09:15:00Z",
  },
  {
    id: "cf-004",
    nome: "permite_contato",
    label: "Permite Contato",
    tipo: "booleano",
    obrigatorio: true,
    descricao: "Autorização para enviar comunicações",
    ordem: 4,
    criadoEm: "2025-02-10T16:45:00Z",
  },
]

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  texto: "Texto",
  numero: "Número",
  data: "Data",
  selecao: "Seleção",
  booleano: "Sim/Não",
  url: "URL",
}

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  texto: "Type",
  numero: "Hash",
  data: "Calendar",
  selecao: "ChevronDown",
  booleano: "ToggleLeft",
  url: "Link",
}

export const FIELD_TYPE_COLORS: Record<FieldType, string> = {
  texto: "#9795e4",
  numero: "#64B5F6",
  data: "#81C784",
  selecao: "#FFB74D",
  booleano: "#4DB6AC",
  url: "#4DD0E1",
}
