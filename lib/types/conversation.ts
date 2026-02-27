/**
 * Conversation Management Types
 * Definições de tipos para o sistema de gestão de conversas CRM
 */

export type ConversationStatus = "open" | "pending" | "solved" | "closed"
export type Priority = "low" | "medium" | "high" | "urgent"
export type Channel = "whatsapp" | "instagram" | "iframe" | "email" | "sms" | "chat"
export type Sentiment = "positive" | "neutral" | "negative"
export type SLAStatus = "ok" | "warning" | "breach"
export type MessageSender = "user" | "agent" | "bot"
export type MessageType = "customer" | "internal"
export type MessageStatus = "sent" | "delivered" | "read"

export interface Agent {
  /** ID único do agente */
  id: string
  /** Nome do agente */
  name: string
  /** Email do agente */
  email: string
  /** Avatar/iniciais do agente */
  avatar: string
}

export interface Attachment {
  /** ID único do anexo */
  id: string
  /** Nome do arquivo */
  filename: string
  /** Tipo MIME */
  mimeType: string
  /** Tamanho em bytes */
  size: number
  /** URL para download */
  url: string
  /** URL do thumbnail (para imagens) */
  thumbnailUrl?: string
}

export interface Message {
  /** ID único da mensagem */
  id: string
  /** ID da conversa */
  conversationId: string
  /** Conteúdo da mensagem */
  content: string
  /** Quem enviou (user, agent, bot) */
  sender: MessageSender
  /** ID do agente (se sender=agent) */
  agentId?: string
  /** Nome do agente (se sender=agent) */
  agentName?: string
  /** Avatar do agente (se sender=agent) */
  agentAvatar?: string
  /** Data/hora da mensagem */
  timestamp: string
  /** Tipo: mensagem ao cliente ou nota interna */
  type: MessageType
  /** Anexos da mensagem */
  attachments?: Attachment[]
  /** Status de entrega (enviada, entregue, lida) */
  status?: MessageStatus
  /** ID da mensagem sendo respondida (threading) */
  replyTo?: string
}

export interface Conversation {
  /** ID único da conversa */
  id: string
  
  // Informações do Contato
  /** ID do contato */
  contactId: string
  /** Nome do contato */
  contactName: string
  /** Email do contato */
  contactEmail: string
  /** Telefone do contato */
  contactPhone?: string
  /** Empresa do contato */
  contactCompany?: string
  /** Cargo do contato */
  contactPosition?: string
  /** Avatar/iniciais do contato */
  contactAvatar: string
  
  // Metadados da Conversa
  /** Canal de comunicação */
  channel: Channel
  /** Status da conversa */
  status: ConversationStatus
  /** Nível de prioridade */
  priority: Priority
  /** Agente atribuído */
  assignedTo: Agent | null
  /** Tags de categorização */
  tags: string[]
  /** Sentimento do cliente */
  sentiment?: Sentiment
  /** Status do SLA */
  slaStatus?: SLAStatus
  
  // Preview e Contadores
  /** Última mensagem (preview) */
  lastMessage: string
  /** Número de mensagens não lidas */
  unreadCount: number
  /** Total de mensagens */
  messageCount: number
  
  // Timestamps
  /** Data de criação */
  createdAt: string
  /** Última atualização */
  updatedAt: string
  /** Data da última mensagem */
  lastMessageAt: string
  /** Data da primeira resposta do agente */
  firstResponseAt?: string
  
  // Mensagens
  /** Array de mensagens da conversa */
  messages: Message[]
  
  // Flags
  /** Marcado como favorito */
  starred?: boolean
  /** Foi arquivada */
  archived?: boolean
}

export interface ConversationFilters {
  /** Busca por texto */
  search: string
  /** Filtro por status */
  status: ConversationStatus | "todos"
  /** Filtro por prioridade */
  priority: Priority | "todos"
  /** Filtro por canal */
  channel: Channel | "todos"
  /** Filtro por atribuição */
  assignedTo: string | "todos" | "me" | "unassigned"
  /** Data inicial */
  dateFrom?: string
  /** Data final */
  dateTo?: string
  /** Apenas favoritas */
  starredOnly?: boolean
  /** Mostrar arquivadas */
  showArchived?: boolean
}

export interface ConversationKPIs {
  /** Total de conversas abertas */
  openConversations: number
  /** Tempo médio de primeira resposta (em minutos) */
  avgFirstResponseTime: number
  /** Taxa de resolução (percentual) */
  resolutionRate: number
  /** Score de satisfação do cliente (CSAT) */
  customerSatisfaction: number
  /** Tendências (variação percentual) */
  trends: {
    openConversations: number
    avgFirstResponseTime: number
    resolutionRate: number
    customerSatisfaction: number
  }
}
