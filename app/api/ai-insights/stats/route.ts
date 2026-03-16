/**
 * AI Insights Stats API
 * GET: Estatísticas de insights da organização
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const [
      totalActive,
      byType,
      byStatus,
      recentCount,
      clickedCount,
    ] = await Promise.all([
      // Total ativos
      prisma.aiInsight.count({
        where: {
          organizationId: user.organization.id,
          status: 'ACTIVE',
        },
      }),

      // Por tipo
      prisma.aiInsight.groupBy({
        by: ['type'],
        where: { organizationId: user.organization.id },
        _count: { id: true },
      }),

      // Por status
      prisma.aiInsight.groupBy({
        by: ['status'],
        where: { organizationId: user.organization.id },
        _count: { id: true },
      }),

      // Criados nos últimos 7 dias
      prisma.aiInsight.count({
        where: {
          organizationId: user.organization.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Clicados
      prisma.aiInsight.count({
        where: {
          organizationId: user.organization.id,
          clickedAt: { not: null },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalActive,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentCount,
        clickedCount,
        clickRate: totalActive > 0 ? Math.round((clickedCount / totalActive) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('AI Insights Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
