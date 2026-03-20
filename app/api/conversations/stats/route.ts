/**
 * Conversations Stats API
 * GET: Estatísticas de conversas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const period = searchParams.get('period') || '7d';
    const startDate = new Date();
    
    // Calcular data de início
    const days = parseInt(period.replace('d', '')) || 7;
    startDate.setDate(startDate.getDate() - days);

    const now = new Date();

    const [
      totalCount,
      activeCount,
      expiredCount,
      byStatus,
      byType,
      withMessages,
      totalMessages,
      avgMessagesPerConversation,
    ] = await Promise.all([
      // Total de conversas
      prisma.conversation.count({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
      }),

      // Conversas com janela ativa
      prisma.conversation.count({
        where: {
          organizationId: user.organization.id,
          windowEnd: { gte: now },
          status: 'ACTIVE',
        },
      }),

      // Conversas expiradas
      prisma.conversation.count({
        where: {
          organizationId: user.organization.id,
          windowEnd: { lt: now },
          status: 'ACTIVE',
        },
      }),

      // Por status
      prisma.conversation.groupBy({
        by: ['status'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Por tipo
      prisma.conversation.groupBy({
        by: ['type'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Conversas com mensagens
      prisma.conversation.count({
        where: {
          organizationId: user.organization.id,
          messageCount: { gt: 0 },
          createdAt: { gte: startDate },
        },
      }),

      // Total de mensagens no período
      prisma.message.count({
        where: {
          conversation: {
            organizationId: user.organization.id,
          },
          createdAt: { gte: startDate },
        },
      }),

      // Média de mensagens por conversa
      prisma.conversation.aggregate({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _avg: { messageCount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalCount,
        activeCount,
        expiredCount,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        withMessages,
        totalMessages,
        avgMessagesPerConversation: Math.round((avgMessagesPerConversation._avg.messageCount || 0) * 10) / 10,
        engagementRate: totalCount > 0 ? Math.round((withMessages / totalCount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Conversations Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
