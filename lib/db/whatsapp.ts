/**
 * WhatsApp Database Operations
 * 
 * Funções de acesso ao banco de dados para a integração WhatsApp Business API.
 * Inclui CRUD completo para todos os modelos e funções específicas de negócio.
 * 
 * @module lib/db/whatsapp
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS AUXILIARES
// ============================================

export type CreateWABAInput = {
  wabaId: string;
  name: string;
  displayName?: string;
  timezoneId?: string;
  messageTemplateNamespace?: string;
  userId: string;
};

export type UpdateWABAInput = Partial<Omit<CreateWABAInput, 'wabaId' | 'userId'>> & {
  status?: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'SUSPENDED';
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  connectedAt?: Date;
};

export type CreatePhoneNumberInput = {
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName?: string;
  wabaId: string;
  isDefault?: boolean;
};

export type UpdatePhoneNumberInput = Partial<Omit<CreatePhoneNumberInput, 'phoneNumberId' | 'wabaId'>> & {
  status?: 'PENDING' | 'VERIFIED' | 'BLOCKED' | 'DELETED';
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingTier?: number;
  messagingLimit?: number;
  verificationCode?: string;
  codeExpiresAt?: Date;
};

export type CreateTemplateInput = {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  components: Record<string, unknown>;
  body: string;
  header?: string;
  footer?: string;
  wabaId: string;
};

export type UpdateTemplateInput = Partial<Omit<CreateTemplateInput, 'wabaId'>> & {
  templateId?: string;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  reason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
};

export type CreateConversationInput = {
  contactPhone: string;
  contactName?: string;
  type: 'USER_INITIATED' | 'BUSINESS_INITIATED' | 'REFERRAL_INITIATED';
  windowStart: Date;
  windowEnd: Date;
  wabaId: string;
  phoneNumberId: string;
  conversationId?: string;
};

export type UpdateConversationInput = Partial<Omit<CreateConversationInput, 'wabaId' | 'phoneNumberId'>> & {
  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
};

export type CreateMessageInput = {
  direction: 'INBOUND' | 'OUTBOUND';
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'TEMPLATE' | 'INTERACTIVE';
  content: string;
  mediaUrl?: string;
  caption?: string;
  conversationId: string;
  templateId?: string;
  messageId?: string;
};

export type UpdateMessageInput = Partial<Omit<CreateMessageInput, 'conversationId'>> & {
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failedReason?: string;
};

export type CreateWebhookEventInput = {
  objectType: string;
  eventType: string;
  payload: Record<string, unknown>;
  wabaId: string;
};

export type CreateAnalyticsInput = {
  date: Date;
  wabaId: string;
  conversationsTotal?: number;
  conversationsUserInitiated?: number;
  conversationsBusinessInitiated?: number;
  messagesSent?: number;
  messagesDelivered?: number;
  messagesRead?: number;
  messagesFailed?: number;
  templatesSent?: number;
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
};

// ============================================
// WHATSAPP BUSINESS ACCOUNT (WABA)
// ============================================

/**
 * Cria uma nova conta WhatsApp Business
 */
export async function createWABA(data: CreateWABAInput) {
  return prisma.whatsAppBusinessAccount.create({
    data: {
      ...data,
      status: 'NOT_CONNECTED',
    },
  });
}

/**
 * Busca uma WABA pelo ID interno
 */
export async function getWABAById(id: string) {
  return prisma.whatsAppBusinessAccount.findUnique({
    where: { id },
    include: {
      phoneNumbers: true,
      messageTemplates: true,
      user: true,
    },
  });
}

/**
 * Busca uma WABA pelo ID da Meta (wabaId)
 */
export async function getWABAByWabaId(wabaId: string) {
  return prisma.whatsAppBusinessAccount.findUnique({
    where: { wabaId },
    include: {
      phoneNumbers: true,
      messageTemplates: true,
    },
  });
}

/**
 * Lista todas as WABAs de um usuário
 */
export async function getWABAsByUser(userId: string) {
  return prisma.whatsAppBusinessAccount.findMany({
    where: { userId },
    include: {
      phoneNumbers: {
        where: { status: 'VERIFIED' },
      },
      _count: {
        select: {
          conversations: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Atualiza uma WABA
 */
export async function updateWABA(id: string, data: UpdateWABAInput) {
  return prisma.whatsAppBusinessAccount.update({
    where: { id },
    data,
  });
}

/**
 * Marca uma WABA como conectada
 */
export async function markWABAAsConnected(id: string) {
  return prisma.whatsAppBusinessAccount.update({
    where: { id },
    data: {
      status: 'CONNECTED',
      connectedAt: new Date(),
    },
  });
}

/**
 * Remove uma WABA (e todos os dados relacionados via cascade)
 */
export async function deleteWABA(id: string) {
  return prisma.whatsAppBusinessAccount.delete({
    where: { id },
  });
}

// ============================================
// PHONE NUMBERS
// ============================================

/**
 * Adiciona um número de telefone à WABA
 */
export async function createPhoneNumber(data: CreatePhoneNumberInput) {
  // Se for default, remove o default dos outros números
  if (data.isDefault) {
    await prisma.whatsAppPhoneNumber.updateMany({
      where: { wabaId: data.wabaId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.whatsAppPhoneNumber.create({
    data: {
      ...data,
      status: 'PENDING',
      qualityRating: 'UNKNOWN',
      messagingTier: 1,
      messagingLimit: 250,
    },
  });
}

/**
 * Busca um número de telefone pelo ID interno
 */
export async function getPhoneNumberById(id: string) {
  return prisma.whatsAppPhoneNumber.findUnique({
    where: { id },
    include: { waba: true },
  });
}

/**
 * Busca um número de telefone pelo ID da Meta
 */
export async function getPhoneNumberByPhoneNumberId(phoneNumberId: string) {
  return prisma.whatsAppPhoneNumber.findUnique({
    where: { phoneNumberId },
    include: { waba: true },
  });
}

/**
 * Lista números de telefone de uma WABA
 */
export async function getPhoneNumbersByWABA(wabaId: string) {
  return prisma.whatsAppPhoneNumber.findMany({
    where: { wabaId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Obtém o número padrão de uma WABA
 */
export async function getDefaultPhoneNumber(wabaId: string) {
  return prisma.whatsAppPhoneNumber.findFirst({
    where: { wabaId, isDefault: true },
  });
}

/**
 * Atualiza um número de telefone
 */
export async function updatePhoneNumber(id: string, data: UpdatePhoneNumberInput) {
  // Se for definido como default, remove dos outros
  if (data.isDefault) {
    const phone = await prisma.whatsAppPhoneNumber.findUnique({
      where: { id },
      select: { wabaId: true },
    });
    if (phone) {
      await prisma.whatsAppPhoneNumber.updateMany({
        where: { wabaId: phone.wabaId, isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  return prisma.whatsAppPhoneNumber.update({
    where: { id },
    data,
  });
}

/**
 * Define um número como padrão para a WABA
 */
export async function setDefaultPhoneNumber(id: string) {
  const phone = await prisma.whatsAppPhoneNumber.findUnique({
    where: { id },
    select: { wabaId: true },
  });

  if (!phone) throw new Error('Phone number not found');

  await prisma.whatsAppPhoneNumber.updateMany({
    where: { wabaId: phone.wabaId, isDefault: true },
    data: { isDefault: false },
  });

  return prisma.whatsAppPhoneNumber.update({
    where: { id },
    data: { isDefault: true },
  });
}

/**
 * Remove um número de telefone
 */
export async function deletePhoneNumber(id: string) {
  return prisma.whatsAppPhoneNumber.delete({
    where: { id },
  });
}

// ============================================
// MESSAGE TEMPLATES
// ============================================

/**
 * Cria um novo template de mensagem
 */
export async function createTemplate(data: CreateTemplateInput) {
  return prisma.messageTemplate.create({
    data: {
      ...data,
      status: 'DRAFT',
    },
  });
}

/**
 * Busca um template pelo ID interno
 */
export async function getTemplateById(id: string) {
  return prisma.messageTemplate.findUnique({
    where: { id },
    include: { waba: true },
  });
}

/**
 * Busca um template pelo ID da Meta
 */
export async function getTemplateByTemplateId(templateId: string) {
  return prisma.messageTemplate.findUnique({
    where: { templateId },
  });
}

/**
 * Lista templates de uma WABA
 */
export async function getTemplatesByWABA(wabaId: string, options?: {
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  category?: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language?: string;
}) {
  const where: Record<string, unknown> = { wabaId };
  
  if (options?.status) where.status = options.status;
  if (options?.category) where.category = options.category;
  if (options?.language) where.language = options.language;

  return prisma.messageTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Busca templates aprovados de uma WABA
 */
export async function getApprovedTemplates(wabaId: string, language?: string) {
  return prisma.messageTemplate.findMany({
    where: {
      wabaId,
      status: 'APPROVED',
      ...(language && { language }),
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Atualiza um template
 */
export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  return prisma.messageTemplate.update({
    where: { id },
    data,
  });
}

/**
 * Submete um template para aprovação
 */
export async function submitTemplate(id: string, templateId: string) {
  return prisma.messageTemplate.update({
    where: { id },
    data: {
      templateId,
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });
}

/**
 * Marca um template como aprovado
 */
export async function approveTemplate(id: string) {
  return prisma.messageTemplate.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });
}

/**
 * Marca um template como rejeitado
 */
export async function rejectTemplate(id: string, reason: string) {
  return prisma.messageTemplate.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reason,
    },
  });
}

/**
 * Remove um template
 */
export async function deleteTemplate(id: string) {
  return prisma.messageTemplate.delete({
    where: { id },
  });
}

// ============================================
// CONVERSATIONS
// ============================================

/**
 * Cria uma nova conversa
 */
export async function createConversation(data: CreateConversationInput) {
  return prisma.whatsAppConversation.create({
    data: {
      ...data,
      status: 'ACTIVE',
    },
  });
}

/**
 * Busca uma conversa pelo ID interno
 */
export async function getConversationById(id: string) {
  return prisma.whatsAppConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      phoneNumber: true,
    },
  });
}

/**
 * Busca conversa ativa entre WABA e contato
 */
export async function getActiveConversation(wabaId: string, contactPhone: string) {
  const now = new Date();
  
  return prisma.whatsAppConversation.findFirst({
    where: {
      wabaId,
      contactPhone,
      status: 'ACTIVE',
      windowEnd: { gt: now },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Lista conversas de uma WABA
 */
export async function getConversationsByWABA(wabaId: string, options?: {
  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  contactPhone?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = { wabaId };
  
  if (options?.status) where.status = options.status;
  if (options?.contactPhone) where.contactPhone = options.contactPhone;

  return prisma.whatsAppConversation.findMany({
    where,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Lista conversas ativas (com janela aberta)
 */
export async function getActiveConversations(wabaId: string) {
  const now = new Date();
  
  return prisma.whatsAppConversation.findMany({
    where: {
      wabaId,
      status: 'ACTIVE',
      windowEnd: { gt: now },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Atualiza uma conversa
 */
export async function updateConversation(id: string, data: UpdateConversationInput) {
  return prisma.whatsAppConversation.update({
    where: { id },
    data,
  });
}

/**
 * Estende a janela de 24h de uma conversa
 */
export async function extendConversationWindow(id: string, newWindowEnd: Date) {
  return prisma.whatsAppConversation.update({
    where: { id },
    data: { windowEnd: newWindowEnd },
  });
}

/**
 * Fecha uma conversa
 */
export async function closeConversation(id: string) {
  return prisma.whatsAppConversation.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
}

/**
 * Remove uma conversa
 */
export async function deleteConversation(id: string) {
  return prisma.whatsAppConversation.delete({
    where: { id },
  });
}

// ============================================
// MESSAGES
// ============================================

/**
 * Cria uma nova mensagem
 */
export async function createMessage(data: CreateMessageInput) {
  const now = new Date();
  
  return prisma.whatsAppMessage.create({
    data: {
      ...data,
      status: data.direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
      sentAt: data.direction === 'OUTBOUND' ? now : null,
      deliveredAt: data.direction === 'INBOUND' ? now : null,
    },
    include: {
      conversation: true,
    },
  });
}

/**
 * Busca uma mensagem pelo ID interno
 */
export async function getMessageById(id: string) {
  return prisma.whatsAppMessage.findUnique({
    where: { id },
    include: {
      conversation: true,
      template: true,
    },
  });
}

/**
 * Busca uma mensagem pelo ID da Meta
 */
export async function getMessageByMessageId(messageId: string) {
  return prisma.whatsAppMessage.findUnique({
    where: { messageId },
    include: {
      conversation: true,
    },
  });
}

/**
 * Lista mensagens de uma conversa
 */
export async function getMessagesByConversation(
  conversationId: string,
  options?: { limit?: number; before?: Date }
) {
  return prisma.whatsAppMessage.findMany({
    where: {
      conversationId,
      ...(options?.before && { createdAt: { lt: options.before } }),
    },
    include: {
      template: true,
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  });
}

/**
 * Atualiza o status de uma mensagem
 */
export async function updateMessageStatus(
  messageId: string,
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
  options?: { failedReason?: string }
) {
  const data: Record<string, unknown> = { status };
  const now = new Date();

  switch (status) {
    case 'SENT':
      data.sentAt = now;
      break;
    case 'DELIVERED':
      data.deliveredAt = now;
      break;
    case 'READ':
      data.readAt = now;
      break;
    case 'FAILED':
      data.failedAt = now;
      if (options?.failedReason) data.failedReason = options.failedReason;
      break;
  }

  return prisma.whatsAppMessage.update({
    where: { messageId },
    data,
  });
}

/**
 * Atualiza uma mensagem
 */
export async function updateMessage(id: string, data: UpdateMessageInput) {
  return prisma.whatsAppMessage.update({
    where: { id },
    data,
  });
}

/**
 * Remove uma mensagem
 */
export async function deleteMessage(id: string) {
  return prisma.whatsAppMessage.delete({
    where: { id },
  });
}

// ============================================
// WEBHOOK EVENTS
// ============================================

/**
 * Registra um evento de webhook
 */
export async function createWebhookEvent(data: CreateWebhookEventInput) {
  return prisma.webhookEvent.create({
    data: {
      ...data,
      processed: false,
    },
  });
}

/**
 * Busca eventos de webhook não processados
 */
export async function getUnprocessedWebhookEvents(limit = 100) {
  return prisma.webhookEvent.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Busca eventos de webhook de uma WABA
 */
export async function getWebhookEventsByWABA(wabaId: string, options?: {
  eventType?: string;
  processed?: boolean;
  limit?: number;
}) {
  const where: Record<string, unknown> = { wabaId };
  
  if (options?.eventType) where.eventType = options.eventType;
  if (options?.processed !== undefined) where.processed = options.processed;

  return prisma.webhookEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  });
}

/**
 * Marca evento como processado
 */
export async function markWebhookEventAsProcessed(id: string, error?: string) {
  return prisma.webhookEvent.update({
    where: { id },
    data: {
      processed: true,
      processedAt: new Date(),
      error,
    },
  });
}

/**
 * Remove eventos antigos processados
 */
export async function cleanupOldWebhookEvents(before: Date) {
  return prisma.webhookEvent.deleteMany({
    where: {
      processed: true,
      createdAt: { lt: before },
    },
  });
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Cria ou atualiza métricas do dia
 */
export async function upsertAnalytics(data: CreateAnalyticsInput) {
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  return prisma.whatsAppAnalytics.upsert({
    where: {
      wabaId_date: {
        wabaId: data.wabaId,
        date,
      },
    },
    create: {
      ...data,
      date,
    },
    update: {
      ...data,
      date,
    },
  });
}

/**
 * Busca analytics de uma WABA por período
 */
export async function getAnalyticsByWABA(wabaId: string, startDate: Date, endDate: Date) {
  return prisma.whatsAppAnalytics.findMany({
    where: {
      wabaId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Obtém métricas agregadas de uma WABA
 */
export async function getAggregatedAnalytics(wabaId: string, startDate: Date, endDate: Date) {
  const result = await prisma.whatsAppAnalytics.aggregate({
    where: {
      wabaId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      conversationsTotal: true,
      conversationsUserInitiated: true,
      conversationsBusinessInitiated: true,
      messagesSent: true,
      messagesDelivered: true,
      messagesRead: true,
      messagesFailed: true,
      templatesSent: true,
    },
  });

  return {
    conversationsTotal: result._sum.conversationsTotal || 0,
    conversationsUserInitiated: result._sum.conversationsUserInitiated || 0,
    conversationsBusinessInitiated: result._sum.conversationsBusinessInitiated || 0,
    messagesSent: result._sum.messagesSent || 0,
    messagesDelivered: result._sum.messagesDelivered || 0,
    messagesRead: result._sum.messagesRead || 0,
    messagesFailed: result._sum.messagesFailed || 0,
    templatesSent: result._sum.templatesSent || 0,
  };
}

/**
 * Incrementa métricas
 */
export async function incrementAnalytics(
  wabaId: string,
  date: Date,
  metrics: Partial<Omit<CreateAnalyticsInput, 'wabaId' | 'date'>>
) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const existing = await prisma.whatsAppAnalytics.findUnique({
    where: {
      wabaId_date: { wabaId, date: normalizedDate },
    },
  });

  if (existing) {
    return prisma.whatsAppAnalytics.update({
      where: { id: existing.id },
      data: {
        ...(metrics.conversationsTotal && {
          conversationsTotal: { increment: metrics.conversationsTotal },
        }),
        ...(metrics.conversationsUserInitiated && {
          conversationsUserInitiated: { increment: metrics.conversationsUserInitiated },
        }),
        ...(metrics.conversationsBusinessInitiated && {
          conversationsBusinessInitiated: { increment: metrics.conversationsBusinessInitiated },
        }),
        ...(metrics.messagesSent && {
          messagesSent: { increment: metrics.messagesSent },
        }),
        ...(metrics.messagesDelivered && {
          messagesDelivered: { increment: metrics.messagesDelivered },
        }),
        ...(metrics.messagesRead && {
          messagesRead: { increment: metrics.messagesRead },
        }),
        ...(metrics.messagesFailed && {
          messagesFailed: { increment: metrics.messagesFailed },
        }),
        ...(metrics.templatesSent && {
          templatesSent: { increment: metrics.templatesSent },
        }),
        ...(metrics.qualityRating && {
          qualityRating: metrics.qualityRating,
        }),
      },
    });
  }

  return prisma.whatsAppAnalytics.create({
    data: {
      wabaId,
      date: normalizedDate,
      conversationsTotal: metrics.conversationsTotal || 0,
      conversationsUserInitiated: metrics.conversationsUserInitiated || 0,
      conversationsBusinessInitiated: metrics.conversationsBusinessInitiated || 0,
      messagesSent: metrics.messagesSent || 0,
      messagesDelivered: metrics.messagesDelivered || 0,
      messagesRead: metrics.messagesRead || 0,
      messagesFailed: metrics.messagesFailed || 0,
      templatesSent: metrics.templatesSent || 0,
      qualityRating: metrics.qualityRating || 'UNKNOWN',
    },
  });
}

// ============================================
// OPERAÇÕES EM LOTE E UTILITÁRIOS
// ============================================

/**
 * Expira conversas com janela encerrada
 */
export async function expireOldConversations() {
  const now = new Date();
  
  return prisma.whatsAppConversation.updateMany({
    where: {
      status: 'ACTIVE',
      windowEnd: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });
}

/**
 * Remove mensagens antigas de uma conversa
 */
export async function cleanupOldMessages(conversationId: string, before: Date) {
  return prisma.whatsAppMessage.deleteMany({
    where: {
      conversationId,
      createdAt: { lt: before },
    },
  });
}

/**
 * Busca conversas com mensagens recentes
 */
export async function getConversationsWithRecentMessages(wabaId: string, since: Date) {
  return prisma.whatsAppConversation.findMany({
    where: {
      wabaId,
      messages: {
        some: {
          createdAt: { gte: since },
        },
      },
    },
    include: {
      messages: {
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export { prisma };
