import { Tag, MOCK_TAGS, getTagsByIds } from "./tags"

export interface Contact {
  id: string
  nome: string
  sobrenome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  cargo: string
  empresa: string
  instagram?: string
  linkedin?: string
  tags: string[]
  leadScore: number
  status: "ativo" | "inativo" | "pendente" | "convertido"
  origem: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  criadoEm: string
  atualizadoEm: string
  atualizadoPor: string
  avatar?: string
  avatarBg?: string
  ultimoContato?: string
  observacoes?: string
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "cont-001",
    nome: "Ana",
    sobrenome: "Silva",
    email: "ana.silva@email.com",
    telefone: "+55 11 98765-4321",
    cidade: "São Paulo",
    estado: "SP",
    cargo: "Diretora de Marketing",
    empresa: "TechCorp Brasil",
    instagram: "@ana.silva",
    linkedin: "linkedin.com/in/anasilva",
    tags: ["tag-1", "tag-2"],
    leadScore: 95,
    status: "ativo",
    origem: "Facebook Ads",
    utmSource: "facebook",
    utmMedium: "ads",
    utmCampaign: "blackfriday2024",
    criadoEm: "2024-01-15T10:30:00Z",
    atualizadoEm: "2024-06-24T14:20:00Z",
    atualizadoPor: "João Admin",
    avatar: "AS",
    avatarBg: "#E8E7F7",
    ultimoContato: "2024-06-24T10:00:00Z",
    observacoes: "Cliente VIP, interessada em upgrade",
  },
  {
    id: "cont-002",
    nome: "Bruno",
    sobrenome: "Costa",
    email: "bruno.costa@empresa.com.br",
    telefone: "+55 21 99876-5432",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    cargo: "CEO",
    empresa: "Costa & Associados",
    linkedin: "linkedin.com/in/brunocosta",
    tags: ["tag-2", "tag-5"],
    leadScore: 88,
    status: "ativo",
    origem: "Webinar",
    utmSource: "webinar",
    utmMedium: "event",
    utmCampaign: "produtividade2024",
    criadoEm: "2024-02-20T09:15:00Z",
    atualizadoEm: "2024-06-23T16:45:00Z",
    atualizadoPor: "Maria Vendas",
    avatar: "BC",
    avatarBg: "#F0E8F7",
    ultimoContato: "2024-06-23T14:30:00Z",
  },
  {
    id: "cont-003",
    nome: "Carolina",
    sobrenome: "Mendes",
    email: "carol.mendes@gmail.com",
    telefone: "+55 31 98765-1234",
    cidade: "Belo Horizonte",
    estado: "MG",
    cargo: "Gerente Comercial",
    empresa: "Vendas Express",
    instagram: "@carolmendes",
    tags: ["tag-3", "tag-4"],
    leadScore: 45,
    status: "pendente",
    origem: "Newsletter",
    utmSource: "email",
    utmMedium: "newsletter",
    criadoEm: "2024-03-10T14:30:00Z",
    atualizadoEm: "2024-06-22T11:20:00Z",
    atualizadoPor: "Pedro SDR",
    avatar: "CM",
    avatarBg: "#E8F0F7",
    ultimoContato: "2024-06-20T09:00:00Z",
  },
  {
    id: "cont-004",
    nome: "Daniel",
    sobrenome: "Ferreira",
    email: "daniel.ferreira@outlook.com",
    telefone: "+55 41 99988-7766",
    cidade: "Curitiba",
    estado: "PR",
    cargo: "Analista de TI",
    empresa: "InovaTech",
    linkedin: "linkedin.com/in/danielferreira",
    tags: ["tag-8"],
    leadScore: 62,
    status: "ativo",
    origem: "Trial",
    utmSource: "website",
    utmMedium: "direct",
    utmCampaign: "trial14dias",
    criadoEm: "2024-04-05T11:00:00Z",
    atualizadoEm: "2024-06-24T08:15:00Z",
    atualizadoPor: "Sistema",
    avatar: "DF",
    avatarBg: "#F7E8E8",
    ultimoContato: "2024-06-24T08:00:00Z",
  },
  {
    id: "cont-005",
    nome: "Eduarda",
    sobrenome: "Lima",
    email: "eduarda.lima@startup.io",
    telefone: "+55 51 98877-6655",
    cidade: "Porto Alegre",
    estado: "RS",
    cargo: "Founder",
    empresa: "StartupXYZ",
    instagram: "@eduardalima",
    linkedin: "linkedin.com/in/eduardalima",
    tags: ["tag-1", "tag-6", "tag-7"],
    leadScore: 98,
    status: "convertido",
    origem: "Indicação",
    utmSource: "referral",
    utmMedium: "indication",
    criadoEm: "2024-01-28T16:20:00Z",
    atualizadoEm: "2024-06-24T17:00:00Z",
    atualizadoPor: "João Admin",
    avatar: "EL",
    avatarBg: "#E8F7E8",
    ultimoContato: "2024-06-24T16:30:00Z",
    observacoes: "Cliente premium, renovação anual",
  },
  {
    id: "cont-006",
    nome: "Felipe",
    sobrenome: "Santos",
    email: "felipe.santos@corp.net",
    telefone: "+55 11 97766-5544",
    cidade: "São Paulo",
    estado: "SP",
    cargo: "Diretor Financeiro",
    empresa: "Corp Finance",
    linkedin: "linkedin.com/in/felipesantos",
    tags: ["tag-5", "tag-7"],
    leadScore: 75,
    status: "ativo",
    origem: "Parceiro",
    utmSource: "partner",
    utmMedium: "affiliate",
    criadoEm: "2024-05-12T10:45:00Z",
    atualizadoEm: "2024-06-21T13:30:00Z",
    atualizadoPor: "Maria Vendas",
    avatar: "FS",
    avatarBg: "#F7F0E8",
  },
  {
    id: "cont-007",
    nome: "Gabriela",
    sobrenome: "Oliveira",
    email: "gabi.oliveira@email.com",
    telefone: "+55 19 96655-4433",
    cidade: "Campinas",
    estado: "SP",
    cargo: "Coordenadora de RH",
    empresa: "RH Digital",
    instagram: "@gabioliveira",
    tags: ["tag-3", "tag-4"],
    leadScore: 38,
    status: "inativo",
    origem: "Google Ads",
    utmSource: "google",
    utmMedium: "cpc",
    criadoEm: "2024-02-15T09:30:00Z",
    atualizadoEm: "2024-05-20T10:00:00Z",
    atualizadoPor: "Pedro SDR",
    avatar: "GO",
    avatarBg: "#E8E8F7",
  },
  {
    id: "cont-008",
    nome: "Henrique",
    sobrenome: "Rocha",
    email: "henrique.rocha@tech.com",
    telefone: "+55 11 95544-3322",
    cidade: "São Paulo",
    estado: "SP",
    cargo: "CTO",
    empresa: "Tech Solutions",
    linkedin: "linkedin.com/in/henriquerocha",
    tags: ["tag-1", "tag-2", "tag-5"],
    leadScore: 92,
    status: "ativo",
    origem: "LinkedIn",
    utmSource: "linkedin",
    utmMedium: "social",
    criadoEm: "2024-03-25T14:00:00Z",
    atualizadoEm: "2024-06-24T15:45:00Z",
    atualizadoPor: "João Admin",
    avatar: "HR",
    avatarBg: "#F0F7E8",
    ultimoContato: "2024-06-24T14:00:00Z",
  },
]

export function getContactTags(contact: Contact): Tag[] {
  return getTagsByIds(contact.tags || [])
}

export function calculateTotalLeadScore(contacts: Contact[]): number {
  return contacts.reduce((sum, contact) => sum + contact.leadScore, 0)
}

export function getContactsByTag(tagId: string): Contact[] {
  return MOCK_CONTACTS.filter((contact) => contact.tags.includes(tagId))
}

export function getContactsByStatus(status: Contact["status"]): Contact[] {
  return MOCK_CONTACTS.filter((contact) => contact.status === status)
}

export function getContactsByUTM(source?: string, medium?: string, campaign?: string): Contact[] {
  return MOCK_CONTACTS.filter(
    (contact) =>
      (!source || contact.utmSource === source) &&
      (!medium || contact.utmMedium === medium) &&
      (!campaign || contact.utmCampaign === campaign)
  )
}

export const CONTACT_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "#9795e4" },
  { value: "inativo", label: "Inativo", color: "#b3b3e5" },
  { value: "pendente", label: "Pendente", color: "#a5a3d9" },
  { value: "convertido", label: "Convertido", color: "#7c7ab8" },
]

export const CONTACT_ORIGEM_OPTIONS = [
  "Facebook Ads",
  "Google Ads",
  "Instagram",
  "LinkedIn",
  "Orgânico",
  "Newsletter",
  "Webinar",
  "Indicação",
  "Parceiro",
  "Trial",
  "Outro",
]
