export type ScoringCategory = "perfil" | "engajamento" | "conversao"

export interface ScoringRule {
  id: string
  categoria: ScoringCategory
  evento: string
  pontos: number
  ativo: boolean
  descricao?: string
}

export interface ScoringThresholds {
  hot: number
  warm: number
}

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  hot: 70,
  warm: 40,
}

export const MOCK_SCORING_RULES: ScoringRule[] = [
  // CATEGORIA PERFIL
  {
    id: "rule-001",
    categoria: "perfil",
    evento: "Cargo preenchido",
    pontos: 5,
    ativo: true,
    descricao: "Contato informou seu cargo na empresa",
  },
  {
    id: "rule-002",
    categoria: "perfil",
    evento: "Empresa preenchida",
    pontos: 5,
    ativo: true,
    descricao: "Contato informou o nome da empresa",
  },
  {
    id: "rule-003",
    categoria: "perfil",
    evento: "LinkedIn informado",
    pontos: 10,
    ativo: true,
    descricao: "Contato adicionou perfil do LinkedIn",
  },
  {
    id: "rule-004",
    categoria: "perfil",
    evento: "Telefone informado",
    pontos: 8,
    ativo: false,
    descricao: "Contato adicionou número de telefone",
  },
  {
    id: "rule-005",
    categoria: "perfil",
    evento: "Empresa com +50 funcionários",
    pontos: 15,
    ativo: true,
    descricao: "Empresa do contato tem porte médio/grande",
  },
  // CATEGORIA ENGAJAMENTO
  {
    id: "rule-006",
    categoria: "engajamento",
    evento: "Abriu e-mail",
    pontos: 3,
    ativo: true,
    descricao: "Contato abriu e-mail de campanha",
  },
  {
    id: "rule-007",
    categoria: "engajamento",
    evento: "Clicou em link",
    pontos: 5,
    ativo: true,
    descricao: "Contato clicou em link do e-mail",
  },
  {
    id: "rule-008",
    categoria: "engajamento",
    evento: "Visitou página de preços",
    pontos: 10,
    ativo: true,
    descricao: "Contato acessou página de planos",
  },
  {
    id: "rule-009",
    categoria: "engajamento",
    evento: "Assistiu webinar",
    pontos: 15,
    ativo: true,
    descricao: "Contato participou de webinar ao vivo",
  },
  {
    id: "rule-010",
    categoria: "engajamento",
    evento: "Inatividade por 30 dias",
    pontos: -10,
    ativo: false,
    descricao: "Contato sem interação por 30 dias",
  },
  // CATEGORIA CONVERSÃO
  {
    id: "rule-011",
    categoria: "conversao",
    evento: "Solicitou demonstração",
    pontos: 25,
    ativo: true,
    descricao: "Contato agendou demonstração do produto",
  },
  {
    id: "rule-012",
    categoria: "conversao",
    evento: "Enviou formulário de contato",
    pontos: 20,
    ativo: true,
    descricao: "Contato preencheu formulário de interesse",
  },
  {
    id: "rule-013",
    categoria: "conversao",
    evento: "Convertido",
    pontos: 50,
    ativo: true,
    descricao: "Contato se tornou cliente",
  },
  {
    id: "rule-014",
    categoria: "conversao",
    evento: "Cancelou assinatura",
    pontos: -30,
    ativo: true,
    descricao: "Cliente cancelou plano ativo",
  },
]

export const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  perfil: "Perfil",
  engajamento: "Engajamento",
  conversao: "Conversão",
}

export const CATEGORY_COLORS: Record<ScoringCategory, string> = {
  perfil: "#64B5F6",
  engajamento: "#9795e4",
  conversao: "#81C784",
}
