/**
 * Complex Queries for WhatsApp Business API
 * 
 * Queries avançadas, agregações, joins e estatísticas para análise
 * de dados do WhatsApp Business.
 * 
 * @module lib/db/queries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS DE RETORNO
// ============================================

export type ConversationMetrics = {
  total: number;
  active: number;
  expired: number;
  closed: number;
  userInitiated: number;
  businessInitiated: number;
};

export type MessageMetrics = {
  total: number;
  inbound: number;
  outbound: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  byType: Record<string, number>;
};

export type DailyStats = {
  date: string;
  conversations: number;
  messages: number;
  sent: number;
  delivered: number;
  read: number;
};

export type ContactStats = {
  phone: string;
  name: string | null;
  conversationCount: number;
  messageCount: number;
  lastMessageAt: Date | null;
};

export type TemplateStats = {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  usageCount: number;
};

export type QualityMetrics = {
  rating: string;
  count: number;
  percentage: number;
};

export type HourlyActivity = {
  hour: number;
  count: number;
};

// ============================================
// MÉTRICAS DE CONVERSAS
// ============================================

/**
 * Obtém métricas detalhadas de conversas de uma WABA
 */
export async function getConversationMetrics(
  wabaId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ConversationMetrics> {
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const [
    total,
    active,
    expired,
    closed,
    userInitiated,
    businessInitiated,
  ] = await Promise.all([
    prisma.whatsAppConversation.count({
      where: { wabaId, ...dateFilter },
    }),
    prisma.whatsAppConversation.count({
      where: { wabaId, status: 'ACTIVE', ...dateFilter },
    }),
    prisma.whatsAppConversation.count({
      where: { wabaId, status: 'EXPIRED', ...dateFilter },
    }),
    prisma.whatsAppConversation.count({
      where: { wabaId, status: 'CLOSED', ...dateFilter },
    }),
    prisma.whatsAppConversation.count({
      where: { wabaId, type: 'USER_INITIATED', ...dateFilter },
    }),
    prisma.whatsAppConversation.count({
      where: { wabaId, type: 'BUSINESS_INITIATED', ...dateFilter },
    }),
  ]);

  return {
    total,
    active,
    expired,
    closed,
    userInitiated,
    businessInitiated,
  };
}

/**
 * Obtém a distribuição de conversas por dia
 */
export async function getConversationsByDay(
  wabaId: string,
  days: number = 30
): Promise<DailyStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const conversations = await prisma.whatsAppConversation.groupBy({
    by: ['createdAt'],
    where: {
      wabaId,
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  // Agrupa por dia
  const grouped = conversations.reduce((acc, curr) => {
    const date = curr.createdAt.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  // Preenche dias sem dados
  const result: DailyStats[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    result.push({
      date: dateStr,
      conversations: grouped[dateStr] || 0,
      messages: 0,
      sent: 0,
      delivered: 0,
      read: 0,
    });
  }

  return result;
}

/**
 * Obtém conversas que expiram em breve (próximas 2 horas)
 */
export async function getExpiringConversations(
  wabaId: string,
  hours: number = 2
) {
  const now = new Date();
  const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return prisma.whatsAppConversation.findMany({
    where: {
      wabaId,
      status: 'ACTIVE',
      windowEnd: {
        gte: now,
        lte: threshold,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { windowEnd: 'asc' },
  });
}

// ============================================
// MÉTRICAS DE MENSAGENS
// ============================================

/**
 * Obtém métricas detalhadas de mensagens
 */
export async function getMessageMetrics(
  wabaId: string,
  startDate?: Date,
  endDate?: Date
): Promise<MessageMetrics> {
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const where = {
    conversation: { wabaId },
    ...dateFilter,
  };

  const [
    total,
    inbound,
    outbound,
    sent,
    delivered,
    read,
    failed,
    byType,
  ] = await Promise.all([
    prisma.whatsAppMessage.count({ where }),
    prisma.whatsAppMessage.count({
      where: { ...where, direction: 'INBOUND' },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, direction: 'OUTBOUND' },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: 'SENT' },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: 'DELIVERED' },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: 'READ' },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: 'FAILED' },
    }),
    prisma.whatsAppMessage.groupBy({
      by: ['type'],
      where,
      _count: { type: true },
    }),
  ]);

  const byTypeMap = byType.reduce((acc, curr) => {
    acc[curr.type] = curr._count.type;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    inbound,
    outbound,
    sent,
    delivered,
    read,
    failed,
    byType: byTypeMap,
  };
}

/**
 * Calcula taxas de entrega e leitura
 */
export async function getDeliveryRates(
  wabaId: string,
  startDate?: Date,
  endDate?: Date
) {
  const dateFilter = startDate && endDate ? {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  } : {};

  const where = {
    conversation: { wabaId },
    direction: 'OUTBOUND',
    ...dateFilter,
  };

  const [sent, delivered, read] = await Promise.all([
    prisma.whatsAppMessage.count({
      where: { ...where, status: { in: ['SENT', 'DELIVERED', 'READ'] } },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: { in: ['DELIVERED', 'READ'] } },
    }),
    prisma.whatsAppMessage.count({
      where: { ...where, status: 'READ' },
    }),
  ]);

  return {
    sent,
    delivered,
    read,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    readRate: sent > 0 ? (read / sent) * 100 : 0,
  };
}

/**
 * Obtém mensagens por hora do dia
 */
export async function getMessagesByHour(
  wabaId: string,
  days: number = 7
): Promise<HourlyActivity[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      conversation: { wabaId },
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
  });

  const hourlyCount = new Array(24).fill(0).map((_, hour) => ({
    hour,
    count: 0,
  }));

  messages.forEach((msg) => {
    const hour = new Date(msg.createdAt).getHours();
    hourlyCount[hour].count++;
  });

  return hourlyCount;
}

/**
 * Obtém mensagens mais recentes de todas as conversas
 */
export async function getRecentMessages(
  wabaId: string,
  limit: number = 50
) {
  return prisma.whatsAppMessage.findMany({
    where: {
      conversation: { wabaId },
    },
    include: {
      conversation: {
        select: {
          contactPhone: true,
          contactName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ============================================
// ESTATÍSTICAS DE CONTATOS
// ============================================

/**
 * Obtém estatísticas de contatos
 */
export async function getContactStats(
  wabaId: string,
  limit: number = 100
): Promise<ContactStats[]> {
  const conversations = await prisma.whatsAppConversation.findMany({
    where: { wabaId },
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  // Agrupa por contato
  const contactMap = new Map<string, ContactStats>();

  conversations.forEach((conv) => {
    const phone = conv.contactPhone;
    const existing = contactMap.get(phone);

    if (existing) {
      existing.conversationCount += 1;
      existing.messageCount += conv._count.messages;
      if (conv.messages[0]?.createdAt && (!existing.lastMessageAt || conv.messages[0].createdAt > existing.lastMessageAt)) {
        existing.lastMessageAt = conv.messages[0].createdAt;
      }
    } else {
      contactMap.set(phone, {
        phone,
        name: conv.contactName,
        conversationCount: 1,
        messageCount: conv._count.messages,
        lastMessageAt: conv.messages[0]?.createdAt || null,
      });
    }
  });

  return Array.from(contactMap.values()).sort(
    (a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
  );
}

/**
 * Busca contatos por nome ou telefone
 */
export async function searchContacts(
  wabaId: string,
  query: string,
  limit: number = 20
) {
  return prisma.whatsAppConversation.findMany({
    where: {
      wabaId,
      OR: [
        { contactPhone: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } },
      ],
    },
    distinct: ['contactPhone'],
    select: {
      contactPhone: true,
      contactName: true,
    },
    take: limit,
  });
}

// ============================================
// ESTATÍSTICAS DE TEMPLATES
// ============================================

/**
 * Obtém estatísticas de uso de templates
 */
export async function getTemplateStats(wabaId: string): Promise<TemplateStats[]> {
  const templates = await prisma.messageTemplate.findMany({
    where: { wabaId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    language: template.language,
    status: template.status,
    usageCount: template._count.messages,
  }));
}

/**
 * Obtém templates mais utilizados
 */
export async function getTopTemplates(wabaId: string, limit: number = 10) {
  const templates = await prisma.messageTemplate.findMany({
    where: { wabaId, status: 'APPROVED' },
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: {
      messages: { _count: 'desc' },
    },
    take: limit,
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    language: t.language,
    usageCount: t._count.messages,
  }));
}

// ============================================
// MÉTRICAS DE QUALIDADE
// ============================================

/**
 * Obtém métricas de qualidade dos números
 */
export async function getQualityMetrics(wabaId: string): Promise<QualityMetrics[]> {
  const phones = await prisma.whatsAppPhoneNumber.groupBy({
    by: ['qualityRating'],
    where: { wabaId },
    _count: { qualityRating: true },
  });

  const total = phones.reduce((sum, p) => sum + p._count.qualityRating, 0);

  return phones.map((p) => ({
    rating: p.qualityRating,
    count: p._count.qualityRating,
    percentage: total > 0 ? (p._count.qualityRating / total) * 100 : 0,
  }));
}

/**
 * Obtém histórico de qualidade ao longo do tempo
 */
export async function getQualityHistory(
  wabaId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.whatsAppAnalytics.findMany({
    where: {
      wabaId,
      date: { gte: startDate },
    },
    select: {
      date: true,
      qualityRating: true,
    },
    orderBy: { date: 'asc' },
  });
}

// ============================================
// DASHBOARD E OVERVIEW
// ============================================

/**
 * Obtém dados consolidados para o dashboard
 */
export async function getDashboardData(wabaId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    conversations,
    messages,
    phones,
    templates,
    todayStats,
    weekStats,
    recentMessages,
  ] = await Promise.all([
    // Total de conversas
    prisma.whatsAppConversation.count({ where: { wabaId } }),
    
    // Total de mensagens
    prisma.whatsAppMessage.count({
      where: { conversation: { wabaId } },
    }),
    
    // Números ativos
    prisma.whatsAppPhoneNumber.count({
      where: { wabaId, status: 'VERIFIED' },
    }),
    
    // Templates aprovados
    prisma.messageTemplate.count({
      where: { wabaId, status: 'APPROVED' },
    }),
    
    // Estatísticas de hoje
    getMessageMetrics(wabaId, today, now),
    
    // Estatísticas da semana
    getMessageMetrics(wabaId, weekAgo, now),
    
    // Mensagens recentes
    getRecentMessages(wabaId, 10),
  ]);

  // Calcula médias
  const avgMessagesPerConversation = conversations > 0 
    ? messages / conversations 
    : 0;

  return {
    overview: {
      totalConversations: conversations,
      totalMessages: messages,
      activePhoneNumbers: phones,
      approvedTemplates: templates,
      avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
    },
    today: todayStats,
    week: weekStats,
    recentActivity: recentMessages,
  };
}

/**
 * Obtém overview para múltiplas WABAs (nível de usuário)
 */
export async function getUserOverview(userId: string) {
  const wabas = await prisma.whatsAppBusinessAccount.findMany({
    where: { userId },
    include: {
      phoneNumbers: {
        where: { status: 'VERIFIED' },
      },
      _count: {
        select: {
          conversations: true,
          messageTemplates: true,
        },
      },
    },
  });

  const wabaIds = wabas.map((w) => w.id);

  const totalMessages = await prisma.whatsAppMessage.count({
    where: {
      conversation: {
        wabaId: { in: wabaIds },
      },
    },
  });

  return {
    totalWABAs: wabas.length,
    totalPhoneNumbers: wabas.reduce((sum, w) => sum + w.phoneNumbers.length, 0),
    totalConversations: wabas.reduce((sum, w) => sum + w._count.conversations, 0),
    totalMessages,
    totalTemplates: wabas.reduce((sum, w) => sum + w._count.messageTemplates, 0),
    wabas: wabas.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      phoneNumbers: w.phoneNumbers.length,
      conversations: w._count.conversations,
    })),
  };
}

// ============================================
// QUERIES DE MANUTENÇÃO
// ============================================

/**
 * Obtém estatísticas de eventos de webhook
 */
export async function getWebhookStats(wabaId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    total,
    processed,
    failed,
    byType,
  ] = await Promise.all([
    prisma.webhookEvent.count({
      where: { wabaId, createdAt: { gte: startDate } },
    }),
    prisma.webhookEvent.count({
      where: { wabaId, createdAt: { gte: startDate }, processed: true },
    }),
    prisma.webhookEvent.count({
      where: { wabaId, createdAt: { gte: startDate }, error: { not: null } },
    }),
    prisma.webhookEvent.groupBy({
      by: ['eventType'],
      where: { wabaId, createdAt: { gte: startDate } },
      _count: { eventType: true },
    }),
  ]);

  return {
    total,
    processed,
    failed,
    pending: total - processed,
    byType: byType.map((t) => ({
      type: t.eventType,
      count: t._count.eventType,
    })),
  };
}

/**
 * Verifica tamanho das tabelas (aproximado)
 */
export async function getTableStats(wabaId: string) {
  const [
    conversations,
    messages,
    webhookEvents,
  ] = await Promise.all([
    prisma.whatsAppConversation.count({ where: { wabaId } }),
    prisma.whatsAppMessage.count({
      where: { conversation: { wabaId } },
    }),
    prisma.webhookEvent.count({ where: { wabaId } }),
  ]);

  return {
    conversations,
    messages,
    webhookEvents,
    estimatedTotal: conversations + messages + webhookEvents,
  };
}

// ============================================
// EXPORTAÇÃO DE DADOS
// ============================================

/**
 * Exporta conversas com todas as mensagens
 */
export async function exportConversations(
  wabaId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.whatsAppConversation.findMany({
    where: {
      wabaId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      phoneNumber: {
        select: { displayPhoneNumber: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Exporta mensagens em formato CSV-friendly
 */
export async function exportMessages(
  wabaId: string,
  startDate: Date,
  endDate: Date
) {
  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      conversation: { wabaId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      conversation: {
        select: {
          contactPhone: true,
          contactName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((msg) => ({
    id: msg.id,
    messageId: msg.messageId,
    timestamp: msg.createdAt.toISOString(),
    contactPhone: msg.conversation.contactPhone,
    contactName: msg.conversation.contactName,
    direction: msg.direction,
    type: msg.type,
    content: msg.content,
    status: msg.status,
  }));
}

export { prisma };
