// Mock data for tests - aligned with actual hook types

export const mockOrganizationId = 'org-123'
export const mockUserId = 'user-456'

// Types from use-ai-insights.ts
export type AiInsightType = 'PREDICTION' | 'ALERT' | 'RECOMMENDATION' | 'DISCOVERY'
export type AiInsightStatus = 'ACTIVE' | 'DISMISSED' | 'ARCHIVED'

export interface AiInsight {
  id: string
  type: AiInsightType
  category: string
  title: string
  description: string
  value?: string
  confidence?: number
  metadata?: any
  relatedContactIds: string[]
  relatedDealIds: string[]
  status: AiInsightStatus
  action?: string
  actionUrl?: string
  clickedAt?: string
  dismissedAt?: string
  createdAt: string
  updatedAt: string
}

export const mockAiInsights: AiInsight[] = [
  {
    id: 'insight-1',
    type: 'PREDICTION',
    category: 'conversion',
    title: 'Lead provavelmente converterá',
    description: 'Baseado no histórico de interações, este lead tem 87% de chance de converter em 7 dias.',
    confidence: 87,
    metadata: { probability: 0.87, timeframe: '7d' },
    relatedContactIds: ['contact-1'],
    relatedDealIds: [],
    status: 'ACTIVE',
    action: 'Ver detalhes',
    actionUrl: '/contacts/contact-1',
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'insight-2',
    type: 'ALERT',
    category: 'engagement',
    title: '12 leads sem contato',
    description: 'Identificamos 12 leads que não receberam contato nos últimos 3 dias.',
    confidence: 95,
    metadata: { count: 12, days: 3 },
    relatedContactIds: [],
    relatedDealIds: [],
    status: 'ACTIVE',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'insight-3',
    type: 'RECOMMENDATION',
    category: 'marketing',
    title: 'Aumentar budget de anúncios',
    description: 'Leads de campanha X têm 40% mais conversão. Considere aumentar investimento.',
    confidence: 78,
    metadata: { campaign: 'X', improvement: 0.4 },
    relatedContactIds: [],
    relatedDealIds: [],
    status: 'DISMISSED',
    dismissedAt: '2026-03-12T11:00:00Z',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
]

// Types from use-transcriptions.ts
export type TranscriptionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type TranscriptionSource = 'WHATSAPP_CALL' | 'UPLOAD' | 'API' | 'INSTAGRAM'
export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'

export interface Transcription {
  id: string
  organizationId: string
  contactId?: string
  conversationId?: string
  source: TranscriptionSource
  sourceId?: string
  audioUrl?: string
  audioSize?: number
  duration?: number
  content?: string
  language?: string
  status: TranscriptionStatus
  sentiment?: SentimentType
  sentimentScore?: number
  topics?: string[]
  actionItems?: string[]
  objections?: string[]
  summary?: string
  converted?: boolean
  resolutionDays?: number
  metadata?: any
  processedAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export const mockTranscriptions: Transcription[] = [
  {
    id: 'trans-1',
    organizationId: mockOrganizationId,
    contactId: 'contact-1',
    source: 'WHATSAPP_CALL',
    audioUrl: 'https://example.com/audio1.mp3',
    duration: 120,
    content: 'Vendedor: Olá, como posso ajudar?\nCliente: Gostaria de saber mais sobre o produto.',
    language: 'pt-BR',
    status: 'COMPLETED',
    sentiment: 'POSITIVE',
    sentimentScore: 0.85,
    topics: ['produto', 'preço'],
    actionItems: ['Enviar proposta'],
    objections: ['preço'],
    converted: true,
    processedAt: '2026-03-12T10:30:00Z',
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
  {
    id: 'trans-2',
    organizationId: mockOrganizationId,
    contactId: 'contact-2',
    source: 'UPLOAD',
    audioUrl: 'https://example.com/audio2.mp3',
    duration: 0,
    status: 'PROCESSING',
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
]

// Types from use-integration-logs.ts
export type IntegrationType = 'WHATSAPP' | 'INSTAGRAM' | 'N8N' | 'MAKE' | 'ZAPIER' | 'WEBHOOK' | 'API'
export type IntegrationActivityType = 
  | 'AUTH_CONNECTED' 
  | 'AUTH_DISCONNECTED' 
  | 'AUTH_REFRESHED' 
  | 'AUTH_FAILED' 
  | 'WEBHOOK_RECEIVED' 
  | 'WEBHOOK_SENT' 
  | 'MESSAGE_SENT' 
  | 'MESSAGE_RECEIVED' 
  | 'SYNC_STARTED' 
  | 'SYNC_COMPLETED' 
  | 'SYNC_FAILED' 
  | 'TEMPLATE_SENT' 
  | 'ERROR' 
  | 'CONFIG_UPDATED'
export type IntegrationActivityStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'WARNING'

export interface IntegrationActivityLog {
  id: string
  integrationType: IntegrationType
  instanceId?: string
  activityType: IntegrationActivityType
  status: IntegrationActivityStatus
  title: string
  description?: string
  requestPayload?: any
  responsePayload?: any
  errorMessage?: string
  errorCode?: string
  contactId?: string
  dealId?: string
  messageId?: string
  durationMs?: number
  retryCount: number
  maxRetries: number
  createdAt: string
  completedAt?: string
}

export const mockIntegrationLogs: IntegrationActivityLog[] = [
  {
    id: 'log-1',
    integrationType: 'WHATSAPP',
    activityType: 'MESSAGE_SENT',
    title: 'Mensagem enviada',
    description: 'Mensagem enviada com sucesso',
    status: 'SUCCESS',
    requestPayload: { to: '5511999999999', message: 'Olá!' },
    responsePayload: { messageId: 'msg-123' },
    durationMs: 245,
    retryCount: 0,
    maxRetries: 3,
    createdAt: '2026-03-12T14:00:00Z',
  },
  {
    id: 'log-2',
    integrationType: 'INSTAGRAM',
    activityType: 'WEBHOOK_RECEIVED',
    title: 'Webhook recebido',
    status: 'FAILED',
    requestPayload: { type: 'message' },
    errorMessage: 'Invalid signature',
    durationMs: 50,
    retryCount: 1,
    maxRetries: 3,
    createdAt: '2026-03-12T13:55:00Z',
  },
  {
    id: 'log-3',
    integrationType: 'API',
    activityType: 'MESSAGE_SENT',
    title: 'Pagamento criado',
    status: 'SUCCESS',
    requestPayload: { amount: 9900 },
    responsePayload: { id: 'pi_123' },
    durationMs: 120,
    retryCount: 0,
    maxRetries: 3,
    createdAt: '2026-03-12T13:50:00Z',
  },
]

// Types from use-conversations.ts
export type ConversationStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED'
export type ConversationType = 'USER_INITIATED' | 'BUSINESS_INITIATED' | 'REFERRAL_INITIATED'
export type MessageDirection = 'INBOUND' | 'OUTBOUND'
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'TEMPLATE' | 'INTERACTIVE'
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface Message {
  id: string
  conversationId: string
  contactId: string
  messageId?: string
  direction: MessageDirection
  type: MessageType
  content: string
  mediaUrl?: string
  caption?: string
  templateId?: string
  template?: { id: string; name: string; category: string }
  status: MessageStatus
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  failedAt?: string
  failedReason?: string
  metadata?: any
  createdAt: string
}

export interface Conversation {
  id: string
  contactId: string
  instanceId: string
  conversationId?: string
  type: ConversationType
  status: ConversationStatus
  windowStart: string
  windowEnd: string
  lastMessageAt?: string
  messageCount: number
  isWindowActive: boolean
  timeUntilWindowExpires: number
  createdAt: string
  contact?: { id: string; name: string; phone: string; avatarUrl?: string; status: string }
  instance?: { id: string; name: string; displayPhoneNumber?: string; verifiedName?: string }
  messages?: Message[]
}

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    contactId: 'contact-1',
    direction: 'INBOUND',
    type: 'TEXT',
    content: 'Olá, gostaria de mais informações',
    status: 'READ',
    createdAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    contactId: 'contact-1',
    direction: 'OUTBOUND',
    type: 'TEXT',
    content: 'Claro! Como posso ajudar?',
    status: 'READ',
    createdAt: '2026-03-12T10:05:00Z',
  },
]

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    contactId: 'contact-1',
    instanceId: 'instance-1',
    type: 'USER_INITIATED',
    status: 'ACTIVE',
    windowStart: '2026-03-12T10:00:00Z',
    windowEnd: '2026-03-13T10:00:00Z',
    lastMessageAt: '2026-03-12T10:05:00Z',
    messageCount: 2,
    isWindowActive: true,
    timeUntilWindowExpires: 82800000,
    createdAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'conv-2',
    contactId: 'contact-2',
    instanceId: 'instance-1',
    type: 'BUSINESS_INITIATED',
    status: 'EXPIRED',
    windowStart: '2026-03-10T10:00:00Z',
    windowEnd: '2026-03-11T10:00:00Z',
    lastMessageAt: '2026-03-11T10:00:00Z',
    messageCount: 1,
    isWindowActive: false,
    timeUntilWindowExpires: 0,
    createdAt: '2026-03-10T10:00:00Z',
  },
]

// Types from use-schedules.ts (Sprint 2)
export type ScheduleType = 'meeting' | 'task' | 'call' | 'deadline'
export type ScheduleStatus = 'pending' | 'completed' | 'cancelled'

export interface Schedule {
  id: string
  organizationId: string
  type: ScheduleType
  title: string
  description: string | null
  contactId: string | null
  contact: {
    id: string
    name: string | null
    phone: string
    avatarUrl: string | null
  } | null
  dealId: string | null
  deal: {
    id: string
    title: string
  } | null
  assignedTo: string | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  startTime: string
  endTime: string
  completedAt: string | null
  status: ScheduleStatus
  location: string | null
  createdAt: string
  updatedAt: string
}

export const mockSchedules: Schedule[] = [
  {
    id: 'schedule-1',
    organizationId: mockOrganizationId,
    type: 'meeting',
    title: 'Reunião com Cliente A',
    description: 'Apresentação do produto',
    contactId: 'contact-1',
    contact: {
      id: 'contact-1',
      name: 'João Silva',
      phone: '+5511999999999',
      avatarUrl: null,
    },
    dealId: 'deal-1',
    deal: {
      id: 'deal-1',
      title: 'Venda de Software',
    },
    assignedTo: 'user-1',
    assignee: {
      id: 'user-1',
      name: 'Maria Vendedora',
      email: 'maria@nexia.com',
    },
    startTime: '2026-03-15T10:00:00Z',
    endTime: '2026-03-15T11:00:00Z',
    completedAt: null,
    status: 'pending',
    location: 'Sala de Reuniões 1',
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'schedule-2',
    organizationId: mockOrganizationId,
    type: 'call',
    title: 'Ligação de Follow-up',
    description: null,
    contactId: 'contact-2',
    contact: {
      id: 'contact-2',
      name: 'Pedro Santos',
      phone: '+5511888888888',
      avatarUrl: null,
    },
    dealId: null,
    deal: null,
    assignedTo: 'user-1',
    assignee: {
      id: 'user-1',
      name: 'Maria Vendedora',
      email: 'maria@nexia.com',
    },
    startTime: '2026-03-14T14:00:00Z',
    endTime: '2026-03-14T14:30:00Z',
    completedAt: '2026-03-14T14:30:00Z',
    status: 'completed',
    location: null,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-14T14:30:00Z',
  },
  {
    id: 'schedule-3',
    organizationId: mockOrganizationId,
    type: 'task',
    title: 'Enviar proposta',
    description: 'Preparar e enviar proposta comercial',
    contactId: null,
    contact: null,
    dealId: 'deal-2',
    deal: {
      id: 'deal-2',
      title: 'Consultoria',
    },
    assignedTo: 'user-2',
    assignee: {
      id: 'user-2',
      name: 'Carlos Gestor',
      email: 'carlos@nexia.com',
    },
    startTime: '2026-03-16T09:00:00Z',
    endTime: '2026-03-16T18:00:00Z',
    completedAt: null,
    status: 'cancelled',
    location: null,
    createdAt: '2026-03-11T10:00:00Z',
    updatedAt: '2026-03-11T10:00:00Z',
  },
  {
    id: 'schedule-4',
    organizationId: mockOrganizationId,
    type: 'deadline',
    title: 'Prazo de Entrega',
    description: 'Data limite para entrega do projeto',
    contactId: null,
    contact: null,
    dealId: null,
    deal: null,
    assignedTo: null,
    assignee: null,
    startTime: '2026-03-20T23:59:00Z',
    endTime: '2026-03-20T23:59:00Z',
    completedAt: null,
    status: 'pending',
    location: null,
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T08:00:00Z',
  },
]
