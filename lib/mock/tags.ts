export interface Tag {
  id: string
  nome: string
  cor: string
  leadScore: number
  contatosCount: number
  automatizacao: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: string
  updatedAt: string
}

export const MOCK_TAGS: Tag[] = [
  {
    id: "tag-1",
    nome: "VIP",
    cor: "#9795e4",
    leadScore: 100,
    contatosCount: 45,
    automatizacao: true,
    utmSource: "facebook",
    utmMedium: "ads",
    utmCampaign: "blackfriday2024",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-20T14:30:00Z",
  },
  {
    id: "tag-2",
    nome: "Lead Quente",
    cor: "#7c7ab8",
    leadScore: 80,
    contatosCount: 128,
    automatizacao: true,
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "search_branding",
    createdAt: "2024-02-10T09:00:00Z",
    updatedAt: "2024-06-18T11:20:00Z",
  },
  {
    id: "tag-3",
    nome: "Lead Frio",
    cor: "#b3b3e5",
    leadScore: 30,
    contatosCount: 342,
    automatizacao: false,
    utmSource: "organic",
    utmMedium: "social",
    createdAt: "2024-03-05T16:45:00Z",
    updatedAt: "2024-06-15T08:10:00Z",
  },
  {
    id: "tag-4",
    nome: "Newsletter",
    cor: "#a5a3d9",
    leadScore: 50,
    contatosCount: 892,
    automatizacao: true,
    utmSource: "email",
    utmMedium: "newsletter",
    createdAt: "2024-01-20T11:30:00Z",
    updatedAt: "2024-06-22T15:00:00Z",
  },
  {
    id: "tag-5",
    nome: "Webinar",
    cor: "#7573b8",
    leadScore: 70,
    contatosCount: 67,
    automatizacao: true,
    utmSource: "webinar",
    utmMedium: "event",
    utmCampaign: "produtividade2024",
    createdAt: "2024-04-12T14:00:00Z",
    updatedAt: "2024-06-21T10:30:00Z",
  },
  {
    id: "tag-6",
    nome: "Indicação",
    cor: "#9b99d1",
    leadScore: 90,
    contatosCount: 23,
    automatizacao: false,
    utmSource: "referral",
    utmMedium: "indication",
    createdAt: "2024-05-01T09:15:00Z",
    updatedAt: "2024-06-19T16:45:00Z",
  },
  {
    id: "tag-7",
    nome: "Parceiro",
    cor: "#8a88c7",
    leadScore: 85,
    contatosCount: 12,
    automatizacao: false,
    utmSource: "partner",
    utmMedium: "affiliate",
    createdAt: "2024-02-28T13:20:00Z",
    updatedAt: "2024-06-17T09:30:00Z",
  },
  {
    id: "tag-8",
    nome: "Trial",
    cor: "#c4c3ea",
    leadScore: 60,
    contatosCount: 156,
    automatizacao: true,
    utmSource: "website",
    utmMedium: "direct",
    utmCampaign: "trial14dias",
    createdAt: "2024-03-20T10:45:00Z",
    updatedAt: "2024-06-23T11:00:00Z",
  },
]

export function getTagById(id: string): Tag | undefined {
  return MOCK_TAGS.find((tag) => tag.id === id)
}

export function getTagsByIds(ids?: string[]): Tag[] {
  if (!ids || !Array.isArray(ids)) return []
  return ids.map((id) => getTagById(id)).filter((tag): tag is Tag => tag !== undefined)
}

export function getTagsByUTM(source?: string, medium?: string, campaign?: string): Tag[] {
  return MOCK_TAGS.filter(
    (tag) =>
      (!source || tag.utmSource === source) &&
      (!medium || tag.utmMedium === medium) &&
      (!campaign || tag.utmCampaign === campaign)
  )
}

export const UTM_SOURCES = [
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "organic", label: "Orgânico" },
  { value: "email", label: "Email" },
  { value: "webinar", label: "Webinar" },
  { value: "referral", label: "Indicação" },
  { value: "partner", label: "Parceiro" },
  { value: "website", label: "Website" },
]

export const UTM_MEDIUMS = [
  { value: "ads", label: "Anúncios" },
  { value: "cpc", label: "CPC" },
  { value: "social", label: "Social" },
  { value: "newsletter", label: "Newsletter" },
  { value: "event", label: "Evento" },
  { value: "indication", label: "Indicação" },
  { value: "affiliate", label: "Afiliado" },
  { value: "direct", label: "Direto" },
]
