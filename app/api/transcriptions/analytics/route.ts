/**
 * Transcriptions Analytics API
 * GET: Estatísticas de transcrições
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const period = searchParams.get('period') || '30d';
    const startDate = new Date();
    
    // Calcular data de início baseada no período
    const days = parseInt(period.replace('d', '')) || 30;
    startDate.setDate(startDate.getDate() - days);

    const [
      totalCount,
      bySource,
      byStatus,
      bySentiment,
      conversionStats,
      totalDuration,
      avgDuration,
    ] = await Promise.all([
      // Total
      prisma.transcription.count({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
      }),

      // Por fonte
      prisma.transcription.groupBy({
        by: ['source'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Por status
      prisma.transcription.groupBy({
        by: ['status'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Por sentimento
      prisma.transcription.groupBy({
        by: ['sentiment'],
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
          sentiment: { not: null },
        },
        _count: { id: true },
      }),

      // Estatísticas de conversão
      prisma.transcription.aggregate({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
        _count: { id: true },
        _sum: { converted: true },
        _avg: { resolutionDays: true },
      }),

      // Duração total
      prisma.transcription.aggregate({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
        },
        _sum: { duration: true },
      }),

      // Duração média
      prisma.transcription.aggregate({
        where: {
          organizationId: user.organization.id,
          createdAt: { gte: startDate },
          duration: { not: null },
        },
        _avg: { duration: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalCount,
        bySource: bySource.reduce((acc, item) => {
          acc[item.source] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        bySentiment: bySentiment.reduce((acc, item) => {
          acc[item.sentiment || 'unknown'] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        conversionStats: {
          total: conversionStats._count.id,
          converted: conversionStats._sum.converted || 0,
          conversionRate: conversionStats._count.id > 0
            ? Math.round(((conversionStats._sum.converted || 0) / conversionStats._count.id) * 100)
            : 0,
          avgResolutionDays: Math.round((conversionStats._avg.resolutionDays || 0) * 10) / 10,
        },
        durationStats: {
          totalMinutes: Math.round((totalDuration._sum.duration || 0) / 60),
          avgMinutes: Math.round((avgDuration._avg.duration || 0) / 60 * 10) / 10,
        },
      },
    });
  } catch (error) {
    console.error('Transcriptions Analytics Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
