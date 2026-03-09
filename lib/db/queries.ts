/**
 * Complex Queries for WhatsApp Business API
 * 
 * Queries avançadas, agregações, joins e estatísticas para análise
 * de dados do WhatsApp Business.
 * Schema flat simplificado - CICLO 2.
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
  id: string;
  phone: string;
  name: string | null;
  conversationCount: number;
  messageCount: number;
  lastMessageAt: Date | null;
  leadScore: number;
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
 * Obtém métricas detalhadas de conversas de uma organização
 */
export async function getConversationMetrics(
  organizationId: string,
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
    prisma.conversation.count({
      where: { organizationId, ...dateFilter },
    }),
    prisma.conversation.count({
      where: { organizationId, status: 'ACTIVE', ...dateFilter },
    }),
    prisma.conversation.count({
      where: { organizationId, status: 'EXPIRED', ...dateFilter },
    }),
    prisma.conversation.count({
      where: { organizationId, status: 'CLOSED', ...dateFilter },
    }),
    prisma.conversation.count({
      where: { organizationId, type: 'USER_INITIATED', ...dateFilter },
    }),
    prisma.conversation.count({
      where: { organizationId, type: 'BUSINESS_INITIATED', ...dateFilter },
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
  organizationId: string,
  days: number = 30
): Promise<DailyStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const conversations = await prisma.conversation.groupBy({
    by: ['createdAt'],
    where: {
      organizationId,
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
  organizationId: string,
  hours: number = 2
) {
  const now = new Date();
  const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return prisma.conversation.findMany({
    where: {
      organizationId,
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
      contact: true,
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
  organizationId: string,
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
    conversation: { organizationId },
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
    prisma.message.count({ where }),
    prisma.message.count({
      where: { ...where, direction: 'INBOUND' },
    }),
    prisma.message.count({
      where: { ...where, direction: 'OUTBOUND' },
    }),
    prisma.message.count({
      where: { ...where, status: 'SENT' },
    }),
    prisma.message.count({
      where: { ...where, status: 'DELIVERED' },
    }),
    prisma.message.count({
      where: { ...where, status: 'READ' },
    }),
    prisma.message.count({
      where: { ...where, status: 'FAILED' },
    }),
    prisma.message.groupBy({
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
  organizationId: string,
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
    conversation: { organizationId },
    direction: 'OUTBOUND',
    ...dateFilter,
  };

  const [sent, delivered, read] = await Promise.all([
    prisma.message.count({
      where: { ...where, status: { in: ['SENT', 'DELIVERED', 'READ'] } },
    }),
    prisma.message.count({
      where: { ...where, status: { in: ['DELIVERED', 'READ'] } },
    }),
    prisma.message.count({
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
  organizationId: string,
  days: number = 7
): Promise<HourlyActivity[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const messages = await prisma.message.findMany({
    where: {
      conversation: { organizationId },
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
  organizationId: string,
  limit: number = 50
) {
  return prisma.message.findMany({
    where: {
      conversation: { organizationId },
    },
    include: {
      contact: {
        select: {
          phone: true,
          name: true,
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
  organizationId: string,
  limit: number = 100
): Promise<ContactStats[]> {
  const contacts = await prisma.contact.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { 
          conversations: true,
          messages: true,
        },
      },
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        take: 1,
        select: { lastMessageAt: true },
      },
    },
    orderBy: { lastInteractionAt: 'desc' },
    take: limit,
  });

  return contacts.map((contact) => ({
    id: contact.id,
    phone: contact.phone,
    name: contact.name,
    conversationCount: contact._count.conversations,
    messageCount: contact._count.messages,
    lastMessageAt: contact.conversations[0]?.lastMessageAt || contact.lastInteractionAt,
    leadScore: contact.leadScore,
  }));
}

/**
 * Busca contatos por nome ou telefone
 */
export async function searchContacts(
  organizationId: string,
  query: string,
  limit: number = 20
) {
  return prisma.contact.findMany({
    where: {
      organizationId,
      OR: [
        { phone: { contains: query } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      phone: true,
      name: true,
      avatarUrl: true,
      leadScore: true,
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
export async function getTemplateStats(instanceId: string): Promise<TemplateStats[]> {
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { instanceId },
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
export async function getTopTemplates(instanceId: string, limit: number = 10) {
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { instanceId, status: 'APPROVED' },
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
 * Obtém métricas de qualidade das instâncias
 */
export async function getQualityMetrics(organizationId: string): Promise<QualityMetrics[]> {
  const instances = await prisma.whatsAppInstance.groupBy({
    by: ['qualityRating'],
    where: { organizationId },
    _count: { qualityRating: true },
  });

  const total = instances.reduce((sum, i) => sum + i._count.qualityRating, 0);

  return instances.map((i) => ({
    rating: i.qualityRating,
    count: i._count.qualityRating,
    percentage: total > 0 ? (i._count.qualityRating / total) * 100 : 0,
  }));
}

/**
 * Obtém histórico de qualidade ao longo do tempo
 * (Baseado nos logs de qualidade das instâncias)
 */
export async function getQualityHistory(
  organizationId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Busca mudanças de qualidade nos logs
  return prisma.whatsAppLog.findMany({
    where: {
      instance: { organizationId },
      type: 'quality_update',
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      payload: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

// ============================================
// DASHBOARD E OVERVIEW
// ============================================

/**
 * Obtém dados consolidados para o dashboard
 */
export async function getDashboardData(organizationId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    conversations,
    messages,
    instances,
    templates,
    contacts,
    todayStats,
    weekStats,
    recentMessages,
  ] = await Promise.all([
    // Total de conversas
    prisma.conversation.count({ where: { organizationId } }),
    
    // Total de mensagens
    prisma.message.count({
      where: { conversation: { organizationId } },
    }),
    
    // Instâncias ativas
    prisma.whatsAppInstance.count({
      where: { organizationId, status: 'CONNECTED' },
    }),
    
    // Templates aprovados
    prisma.whatsAppTemplate.count({
      where: { 
        instance: { organizationId },
        status: 'APPROVED' 
      },
    }),

    // Total de contatos
    prisma.contact.count({ where: { organizationId } }),
    
    // Estatísticas de hoje
    getMessageMetrics(organizationId, today, now),
    
    // Estatísticas da semana
    getMessageMetrics(organizationId, weekAgo, now),
    
    // Mensagens recentes
    getRecentMessages(organizationId, 10),
  ]);

  // Calcula médias
  const avgMessagesPerConversation = conversations > 0 
    ? messages / conversations 
    : 0;

  return {
    overview: {
      totalConversations: conversations,
      totalMessages: messages,
      totalContacts: contacts,
      connectedInstances: instances,
      approvedTemplates: templates,
      avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
    },
    today: todayStats,
    week: weekStats,
    recentActivity: recentMessages,
  };
}

/**
 * Obtém overview para múltiplas organizações (nível de usuário)
 */
export async function getUserOverview(userId: string) {
  // Busca organizações do usuário
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              conversations: true,
              contacts: true,
              whatsappInstances: true,
            },
          },
        },
      },
    },
  });

  const organizationIds = memberships.map((m) => m.organizationId);

  const totalMessages = await prisma.message.count({
    where: {
      conversation: {
        organizationId: { in: organizationIds },
      },
    },
  });

  return {
    totalOrganizations: memberships.length,
    totalWhatsAppInstances: memberships.reduce((sum, m) => sum + m.organization._count.whatsappInstances, 0),
    totalConversations: memberships.reduce((sum, m) => sum + m.organization._count.conversations, 0),
    totalMessages,
    totalContacts: memberships.reduce((sum, m) => sum + m.organization._count.contacts, 0),
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
      whatsappInstances: m.organization._count.whatsappInstances,
      conversations: m.organization._count.conversations,
    })),
  };
}

// ============================================
// QUERIES DE MANUTENÇÃO
// ============================================

/**
 * Obtém estatísticas de logs
 */
export async function getWebhookStats(organizationId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    total,
    processed,
    failed,
    byType,
  ] = await Promise.all([
    prisma.whatsAppLog.count({
      where: { 
        instance: { organizationId },
        createdAt: { gte: startDate } 
      },
    }),
    prisma.whatsAppLog.count({
      where: { 
        instance: { organizationId },
        createdAt: { gte: startDate }, 
        processed: true 
      },
    }),
    prisma.whatsAppLog.count({
      where: { 
        instance: { organizationId },
        createdAt: { gte: startDate }, 
        error: { not: null } 
      },
    }),
    prisma.whatsAppLog.groupBy({
      by: ['type'],
      where: { 
        instance: { organizationId },
        createdAt: { gte: startDate } 
      },
      _count: { type: true },
    }),
  ]);

  return {
    total,
    processed,
    failed,
    pending: total - processed,
    byType: byType.map((t) => ({
      type: t.type,
      count: t._count.type,
    })),
  };
}

/**
 * Verifica tamanho das tabelas (aproximado)
 */
export async function getTableStats(organizationId: string) {
  const [
    conversations,
    messages,
    logs,
    contacts,
  ] = await Promise.all([
    prisma.conversation.count({ where: { organizationId } }),
    prisma.message.count({
      where: { conversation: { organizationId } },
    }),
    prisma.whatsAppLog.count({ 
      where: { instance: { organizationId } } 
    }),
    prisma.contact.count({ where: { organizationId } }),
  ]);

  return {
    conversations,
    messages,
    logs,
    contacts,
    estimatedTotal: conversations + messages + logs + contacts,
  };
}

// ============================================
// EXPORTAÇÃO DE DADOS
// ============================================

/**
 * Exporta conversas com todas as mensagens
 */
export async function exportConversations(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.conversation.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      contact: {
        select: { phone: true, name: true },
      },
      instance: {
        select: { phoneNumber: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Exporta mensagens em formato CSV-friendly
 */
export async function exportMessages(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const messages = await prisma.message.findMany({
    where: {
      conversation: { organizationId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      contact: {
        select: {
          phone: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages.map((msg) => ({
    id: msg.id,
    messageId: msg.messageId,
    timestamp: msg.createdAt.toISOString(),
    contactPhone: msg.contact.phone,
    contactName: msg.contact.name,
    direction: msg.direction,
    type: msg.type,
    content: msg.content,
    status: msg.status,
  }));
}

export { prisma };
