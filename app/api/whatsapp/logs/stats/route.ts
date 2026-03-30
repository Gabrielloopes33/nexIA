/**
 * WhatsApp Logs Stats API Route
 * GET: Get statistics for WhatsApp logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/whatsapp/logs/stats
 * Get statistics for WhatsApp logs
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Fetch all stats in parallel
    const [
      total,
      todayCount,
      yesterdayCount,
      last7DaysCount,
      last30DaysCount,
      errors,
      unprocessed,
      eventTypeBreakdown,
      recentLogs,
    ] = await Promise.all([
      // Total logs
      prisma.metaWebhookLog.count({
        where: { organizationId },
      }),

      // Today's logs
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          createdAt: { gte: today },
        },
      }),

      // Yesterday's logs
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
      }),

      // Last 7 days logs
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          createdAt: { gte: last7Days },
        },
      }),

      // Last 30 days logs
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          createdAt: { gte: last30Days },
        },
      }),

      // Error count
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          errorMessage: { not: null },
        },
      }),

      // Unprocessed count
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          processed: false,
        },
      }),

      // Event type breakdown
      prisma.metaWebhookLog.groupBy({
        by: ['eventType'],
        where: { organizationId },
        _count: { eventType: true },
      }),

      // Recent error logs
      prisma.metaWebhookLog.findMany({
        where: {
          organizationId,
          errorMessage: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          eventType: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate trends (comparing today vs yesterday)
    const todayTrend = yesterdayCount === 0 
      ? 100 
      : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);

    return NextResponse.json({
      success: true,
      data: {
        total,
        today: todayCount,
        yesterday: yesterdayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        errors,
        unprocessed,
        trends: {
          today: todayTrend,
        },
        breakdown: {
          byEventType: eventTypeBreakdown.map((item) => ({
            eventType: item.eventType,
            count: item._count.eventType,
          })),
        },
        recentErrors: recentLogs.map((log) => ({
          id: log.id,
          eventType: log.eventType,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp logs stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs stats' },
      { status: 500 }
    );
  }
}
