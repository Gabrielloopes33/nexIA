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

export const MOCK_LISTS: ContactList[] = [
  {
    id: "list-001",
    nome: "Clientes VIP",
    descricao: "Clientes com alto ticket médio e engajamento",
    cor: "#46347F",
    contatosCount: 45,
    contatosIds: ["cont-001", "cont-005", "cont-008"],
    criadoEm: "2024-12-15T10:30:00Z",
    atualizadoEm: "2025-02-28T14:20:00Z",
    criadoPor: "Admin",
  },
  {
    id: "list-002",
    nome: "Leads do Webinar Março",
    descricao: "Participantes do webinar de produtividade realizado em março",
    cor: "#64B5F6",
    contatosCount: 120,
    contatosIds: ["cont-002", "cont-005"],
    criadoEm: "2025-03-10T09:00:00Z",
    atualizadoEm: "2025-03-15T16:45:00Z",
    criadoPor: "Maria Vendas",
  },
  {
    id: "list-003",
    nome: "Prospects Frios",
    descricao: "Leads com baixo engajamento que precisam de nutrição",
    cor: "#E57373",
    contatosCount: 85,
    contatosIds: ["cont-003", "cont-007"],
    criadoEm: "2025-01-20T11:15:00Z",
    atualizadoEm: "2025-02-10T10:30:00Z",
    criadoPor: "Pedro SDR",
  },
  {
    id: "list-004",
    nome: "Parceiros Estratégicos",
    descricao: "Empresas e profissionais com parcerias ativas",
    cor: "#81C784",
    contatosCount: 18,
    contatosIds: ["cont-005", "cont-006"],
    criadoEm: "2024-11-05T14:00:00Z",
    atualizadoEm: "2025-02-20T09:15:00Z",
    criadoPor: "Admin",
  },
  {
    id: "list-005",
    nome: "Newsletter Julho",
    descricao: "Assinantes da newsletter de julho de 2024",
    cor: "#FFB74D",
    contatosCount: 342,
    contatosIds: [],
    criadoEm: "2024-07-01T08:00:00Z",
    atualizadoEm: "2024-07-31T17:00:00Z",
    criadoPor: "João Admin",
  },
  {
    id: "list-006",
    nome: "Abandono de Carrinho",
    descricao: "Usuários que abandonaram compra nos últimos 30 dias",
    cor: "#BA68C8",
    contatosCount: 67,
    contatosIds: ["cont-004"],
    criadoEm: "2025-02-01T10:00:00Z",
    atualizadoEm: "2025-02-28T11:30:00Z",
    criadoPor: "Maria Vendas",
  },
]

export const LIST_COLORS = [
  "#46347F",
  "#46347F",
  "#46347F",
  "#E57373",
  "#81C784",
  "#64B5F6",
  "#FFB74D",
  "#BA68C8",
  "#4DB6AC",
]
