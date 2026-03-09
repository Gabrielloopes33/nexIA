/**
 * WhatsApp Database Operations
 * 
 * Funções de acesso ao banco de dados para a integração WhatsApp Business API.
 * Schema flat simplificado - CICLO 2.
 * 
 * @module lib/db/whatsapp
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS AUXILIARES
// ============================================

export type CreateInstanceInput = {
  name: string;
  phoneNumber: string;
  phoneNumberId?: string;
  wabaId?: string;
  organizationId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  settings?: Record<string, unknown>;
};

export type UpdateInstanceInput = Partial<Omit<CreateInstanceInput, 'organizationId'>> & {
  status?: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'SUSPENDED' | 'PENDING_SETUP';
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingTier?: number;
  messagingLimit?: number;
  connectedAt?: Date;
};

export type CreateTemplateInput = {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  components: Record<string, unknown>;
  body: string;
  header?: string;
  footer?: string;
  instanceId: string;
};

export type UpdateTemplateInput = Partial<Omit<CreateTemplateInput, 'instanceId'>> & {
  templateId?: string;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  reason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
};

export type CreateContactInput = {
  phone: string;
  name?: string;
  avatarUrl?: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

export type UpdateContactInput = Partial<Omit<CreateContactInput, 'organizationId'>> & {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  leadScore?: number;
  lastInteractionAt?: Date;
};

export type CreateConversationInput = {
  type: 'USER_INITIATED' | 'BUSINESS_INITIATED' | 'REFERRAL_INITIATED';
  windowStart: Date;
  windowEnd: Date;
  organizationId: string;
  instanceId: string;
  contactId: string;
  conversationId?: string;
};

export type UpdateConversationInput = Partial<Omit<CreateConversationInput, 'organizationId' | 'instanceId' | 'contactId'>> & {
  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  lastMessageAt?: Date;
  messageCount?: number;
};

export type CreateMessageInput = {
  direction: 'INBOUND' | 'OUTBOUND';
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'TEMPLATE' | 'INTERACTIVE';
  content: string;
  mediaUrl?: string;
  caption?: string;
  conversationId: string;
  contactId: string;
  templateId?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateMessageInput = Partial<Omit<CreateMessageInput, 'conversationId' | 'contactId'>> & {
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failedReason?: string;
};

export type CreateLogInput = {
  type: string;
  eventType?: string;
  payload: Record<string, unknown>;
  instanceId: string;
};

// ============================================
// WHATSAPP INSTANCE
// ============================================

/**
 * Cria uma nova instância WhatsApp
 */
export async function createInstance(data: CreateInstanceInput) {
  return prisma.whatsAppInstance.create({
    data: {
      ...data,
      status: 'DISCONNECTED',
      qualityRating: 'UNKNOWN',
      messagingTier: 1,
      messagingLimit: 250,
    },
  });
}

/**
 * Busca uma instância pelo ID
 */
export async function getInstanceById(id: string) {
  return prisma.whatsAppInstance.findUnique({
    where: { id },
    include: {
      templates: true,
      organization: true,
    },
  });
}

/**
 * Lista instâncias de uma organização
 */
export async function getInstancesByOrganization(organizationId: string) {
  return prisma.whatsAppInstance.findMany({
    where: { organizationId },
    include: {
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
 * Atualiza uma instância
 */
export async function updateInstance(id: string, data: UpdateInstanceInput) {
  return prisma.whatsAppInstance.update({
    where: { id },
    data,
  });
}

/**
 * Marca uma instância como conectada
 */
export async function markInstanceAsConnected(id: string) {
  return prisma.whatsAppInstance.update({
    where: { id },
    data: {
      status: 'CONNECTED',
      connectedAt: new Date(),
    },
  });
}

/**
 * Remove uma instância
 */
export async function deleteInstance(id: string) {
  return prisma.whatsAppInstance.delete({
    where: { id },
  });
}

/**
 * Busca uma instância pelo WABA ID e Organization ID
 */
export async function getInstanceByWabaId(organizationId: string, wabaId: string) {
  return prisma.whatsAppInstance.findFirst({
    where: {
      organizationId,
      wabaId,
    },
  });
}

/**
 * Busca uma instância pelo Phone Number ID e Organization ID
 */
export async function getInstanceByPhoneNumberId(organizationId: string, phoneNumberId: string) {
  return prisma.whatsAppInstance.findFirst({
    where: {
      organizationId,
      phoneNumberId,
    },
  });
}

/**
 * Upsert de instância WhatsApp (cria ou atualiza)
 * Busca existente por organization_id + waba_id ou organization_id + phone_number_id
 */
export async function upsertWhatsAppInstance(params: {
  organizationId: string;
  wabaId?: string;
  phoneNumberId?: string;
  data: CreateInstanceInput & Partial<UpdateInstanceInput>;
}) {
  const { organizationId, wabaId, phoneNumberId, data } = params;

  let existingInstance: { id: string } | null = null;

  // Buscar por waba_id
  if (wabaId) {
    existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        organizationId,
        wabaId,
      },
      select: { id: true },
    });
  }

  // Buscar por phone_number_id
  if (!existingInstance && phoneNumberId) {
    existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        organizationId,
        phoneNumberId,
      },
      select: { id: true },
    });
  }

  if (existingInstance) {
    // Atualizar instância existente
    // Não sobrescrever token se não estiver sendo enviado
    const updateData: UpdateInstanceInput = { ...data };
    if (!data.accessToken) delete updateData.accessToken;
    if (!data.tokenExpiresAt) delete updateData.tokenExpiresAt;

    return prisma.whatsAppInstance.update({
      where: { id: existingInstance.id },
      data: updateData,
    });
  }

  // Criar nova instância
  return createInstance(data as CreateInstanceInput);
}

// ============================================
// TEMPLATES
// ============================================

/**
 * Cria um novo template
 */
export async function createTemplate(data: CreateTemplateInput) {
  return prisma.whatsAppTemplate.create({
    data: {
      ...data,
      status: 'DRAFT',
    },
  });
}

/**
 * Busca um template pelo ID
 */
export async function getTemplateById(id: string) {
  return prisma.whatsAppTemplate.findUnique({
    where: { id },
    include: { instance: true },
  });
}

/**
 * Busca um template pelo ID da Meta
 */
export async function getTemplateByTemplateId(templateId: string) {
  return prisma.whatsAppTemplate.findUnique({
    where: { templateId },
  });
}

/**
 * Lista templates de uma instância
 */
export async function getTemplatesByInstance(instanceId: string, options?: {
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  category?: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language?: string;
}) {
  const where: Record<string, unknown> = { instanceId };
  
  if (options?.status) where.status = options.status;
  if (options?.category) where.category = options.category;
  if (options?.language) where.language = options.language;

  return prisma.whatsAppTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Busca templates aprovados
 */
export async function getApprovedTemplates(instanceId: string, language?: string) {
  return prisma.whatsAppTemplate.findMany({
    where: {
      instanceId,
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
  return prisma.whatsAppTemplate.update({
    where: { id },
    data,
  });
}

/**
 * Submete um template para aprovação
 */
export async function submitTemplate(id: string, templateId: string) {
  return prisma.whatsAppTemplate.update({
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
  return prisma.whatsAppTemplate.update({
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
  return prisma.whatsAppTemplate.update({
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
  return prisma.whatsAppTemplate.delete({
    where: { id },
  });
}

// ============================================
// CONTACTS
// ============================================

/**
 * Cria um novo contato
 */
export async function createContact(data: CreateContactInput) {
  return prisma.contact.create({
    data: {
      ...data,
      status: 'ACTIVE',
      leadScore: 0,
    },
  });
}

/**
 * Busca um contato pelo ID
 */
export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      conversations: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
}

/**
 * Busca contato por telefone em uma organização
 */
export async function getContactByPhone(organizationId: string, phone: string) {
  return prisma.contact.findUnique({
    where: {
      organizationId_phone: {
        organizationId,
        phone,
      },
    },
  });
}

/**
 * Lista contatos de uma organização
 */
export async function getContactsByOrganization(
  organizationId: string,
  options?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Record<string, unknown> = { organizationId };
  
  if (options?.status) where.status = options.status;
  if (options?.tags?.length) where.tags = { hasSome: options.tags };
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { phone: { contains: options.search } },
    ];
  }

  return prisma.contact.findMany({
    where,
    orderBy: { lastInteractionAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Atualiza um contato
 */
export async function updateContact(id: string, data: UpdateContactInput) {
  return prisma.contact.update({
    where: { id },
    data,
  });
}

/**
 * Atualiza o lead score de um contato
 */
export async function updateContactLeadScore(id: string, scoreDelta: number) {
  return prisma.contact.update({
    where: { id },
    data: {
      leadScore: { increment: scoreDelta },
    },
  });
}

/**
 * Remove um contato
 */
export async function deleteContact(id: string) {
  return prisma.contact.delete({
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
  return prisma.conversation.create({
    data: {
      ...data,
      status: 'ACTIVE',
    },
  });
}

/**
 * Busca uma conversa pelo ID
 */
export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      contact: true,
      instance: true,
    },
  });
}

/**
 * Busca conversa ativa entre organização e contato
 */
export async function getActiveConversation(organizationId: string, contactId: string) {
  const now = new Date();
  
  return prisma.conversation.findFirst({
    where: {
      organizationId,
      contactId,
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
 * Lista conversas de uma organização
 */
export async function getConversationsByOrganization(
  organizationId: string,
  options?: {
    status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
    contactId?: string;
    instanceId?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Record<string, unknown> = { organizationId };
  
  if (options?.status) where.status = options.status;
  if (options?.contactId) where.contactId = options.contactId;
  if (options?.instanceId) where.instanceId = options.instanceId;

  return prisma.conversation.findMany({
    where,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      contact: true,
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
export async function getActiveConversations(organizationId: string) {
  const now = new Date();
  
  return prisma.conversation.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      windowEnd: { gt: now },
    },
    include: {
      contact: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Atualiza uma conversa
 */
export async function updateConversation(id: string, data: UpdateConversationInput) {
  return prisma.conversation.update({
    where: { id },
    data,
  });
}

/**
 * Estende a janela de 24h de uma conversa
 */
export async function extendConversationWindow(id: string, newWindowEnd: Date) {
  return prisma.conversation.update({
    where: { id },
    data: { windowEnd: newWindowEnd },
  });
}

/**
 * Fecha uma conversa
 */
export async function closeConversation(id: string) {
  return prisma.conversation.update({
    where: { id },
    data: { status: 'CLOSED' },
  });
}

/**
 * Remove uma conversa
 */
export async function deleteConversation(id: string) {
  return prisma.conversation.delete({
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
  
  const message = await prisma.message.create({
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

  // Atualiza a conversa
  await prisma.conversation.update({
    where: { id: data.conversationId },
    data: {
      lastMessageAt: now,
      messageCount: { increment: 1 },
    },
  });

  // Atualiza o contato
  await prisma.contact.update({
    where: { id: data.contactId },
    data: {
      lastInteractionAt: now,
    },
  });

  return message;
}

/**
 * Busca uma mensagem pelo ID
 */
export async function getMessageById(id: string) {
  return prisma.message.findUnique({
    where: { id },
    include: {
      conversation: true,
      contact: true,
      template: true,
    },
  });
}

/**
 * Busca uma mensagem pelo ID da Meta
 */
export async function getMessageByMessageId(messageId: string) {
  return prisma.message.findUnique({
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
  return prisma.message.findMany({
    where: {
      conversationId,
      ...(options?.before && { createdAt: { lt: options.before } }),
    },
    include: {
      template: true,
      contact: true,
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

  return prisma.message.update({
    where: { messageId },
    data,
  });
}

/**
 * Atualiza uma mensagem
 */
export async function updateMessage(id: string, data: UpdateMessageInput) {
  return prisma.message.update({
    where: { id },
    data,
  });
}

/**
 * Remove uma mensagem
 */
export async function deleteMessage(id: string) {
  return prisma.message.delete({
    where: { id },
  });
}

// ============================================
// LOGS
// ============================================

/**
 * Registra um log
 */
export async function createLog(data: CreateLogInput) {
  return prisma.whatsAppLog.create({
    data: {
      ...data,
      processed: false,
    },
  });
}

/**
 * Busca logs não processados
 */
export async function getUnprocessedLogs(limit = 100) {
  return prisma.whatsAppLog.findMany({
    where: { processed: false },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Busca logs de uma instância
 */
export async function getLogsByInstance(instanceId: string, options?: {
  type?: string;
  processed?: boolean;
  limit?: number;
}) {
  const where: Record<string, unknown> = { instanceId };
  
  if (options?.type) where.type = options.type;
  if (options?.processed !== undefined) where.processed = options.processed;

  return prisma.whatsAppLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
  });
}

/**
 * Marca log como processado
 */
export async function markLogAsProcessed(id: string, error?: string) {
  return prisma.whatsAppLog.update({
    where: { id },
    data: {
      processed: true,
      processedAt: new Date(),
      error,
    },
  });
}

/**
 * Remove logs antigos processados
 */
export async function cleanupOldLogs(before: Date) {
  return prisma.whatsAppLog.deleteMany({
    where: {
      processed: true,
      createdAt: { lt: before },
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
  
  return prisma.conversation.updateMany({
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
  return prisma.message.deleteMany({
    where: {
      conversationId,
      createdAt: { lt: before },
    },
  });
}

/**
 * Busca conversas com mensagens recentes
 */
export async function getConversationsWithRecentMessages(organizationId: string, since: Date) {
  return prisma.conversation.findMany({
    where: {
      organizationId,
      messages: {
        some: {
          createdAt: { gte: since },
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      contact: true,
    },
  });
}

// ============================================
// MÉTRICAS E ESTATÍSTICAS
// ============================================

/**
 * Obtém estatísticas de uma organização
 */
export async function getOrganizationStats(organizationId: string, startDate: Date, endDate: Date) {
  const [
    totalConversations,
    activeConversations,
    totalMessages,
    messagesByDirection,
    messagesByStatus,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.conversation.count({
      where: { organizationId, status: 'ACTIVE' },
    }),
    prisma.message.count({
      where: {
        conversation: { organizationId },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.message.groupBy({
      by: ['direction'],
      where: {
        conversation: { organizationId },
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { direction: true },
    }),
    prisma.message.groupBy({
      by: ['status'],
      where: {
        conversation: { organizationId },
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { status: true },
    }),
  ]);

  return {
    totalConversations,
    activeConversations,
    totalMessages,
    messagesByDirection,
    messagesByStatus,
  };
}

/**
 * Busca contatos mais engajados
 */
export async function getTopContacts(organizationId: string, limit = 10) {
  return prisma.contact.findMany({
    where: { organizationId },
    orderBy: { leadScore: 'desc' },
    take: limit,
    include: {
      _count: {
        select: { conversations: true },
      },
    },
  });
}

// Exporta o prisma client para uso direto se necessário
export { prisma };
