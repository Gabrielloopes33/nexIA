/**
 * Integration Logs Stats API
 * GET: Estatísticas de logs de integrações
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const period = searchParams.get('period') || '24h';
    const startDate = new Date();
    
    // Calcular data de início
    if (period.endsWith('h')) {
      const hours = parseInt(period.replace('h', '')) || 24;
      startDate.setHours(startDate.getHours() - hours);
    } else if (period.endsWith('d')) {
      const days = parseInt(period.replace('d', '')) || 1;
      startDate.setDate(startDate.getDate() - days);
    }

    const [
      totalCount,
      byIntegrationType,
      byActivityType,
      byStatus,
      recentErrors,
      avgDuration,
    ] = await Promise.all([
      // Total
      prisma.integrationActivityLog.count({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
      }),

      // Por tipo de integração
      prisma.integrationActivityLog.groupBy({
        by: ['integrationType'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Por tipo de atividade
      prisma.integrationActivityLog.groupBy({
        by: ['activityType'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Por status
      prisma.integrationActivityLog.groupBy({
        by: ['status'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Erros recentes
      prisma.integrationActivityLog.findMany({
        where: {
          organizationId: user.organization.id,
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          integrationType: true,
          activityType: true,
          title: true,
          errorMessage: true,
          createdAt: true,
        },
      }),

      // Duração média
      prisma.integrationActivityLog.aggregate({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
          durationMs: { not: null },
        },
        _avg: { durationMs: true },
      }),
    ]);

    // Calcular taxa de sucesso
    const successCount = byStatus.find(s => s.status === 'SUCCESS')?._count.id || 0;
    const failedCount = byStatus.find(s => s.status === 'FAILED')?._count.id || 0;
    const totalWithStatus = successCount + failedCount;

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalCount,
        byIntegrationType: byIntegrationType.reduce((acc, item) => {
          acc[item.integrationType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byActivityType: byActivityType.reduce((acc, item) => {
          acc[item.activityType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        successRate: totalWithStatus > 0 ? Math.round((successCount / totalWithStatus) * 100) : 100,
        avgDurationMs: Math.round(avgDuration._avg.durationMs || 0),
        recentErrors,
      },
    });
  } catch (error) {
    console.error('Integration Logs Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
