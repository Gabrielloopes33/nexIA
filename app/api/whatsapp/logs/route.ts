/**
 * WhatsApp Logs API Route
 * GET: List webhook logs for an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/whatsapp/logs
 * List webhook logs for an organization with pagination and filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const instanceId = searchParams.get('instanceId');
    const eventType = searchParams.get('eventType');
    const processed = searchParams.get('processed');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    // Filter by instance
    if (instanceId && instanceId !== 'all') {
      where.OR = [
        { whatsappInstanceId: instanceId },
        { instagramInstanceId: instanceId },
      ];
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      where.eventType = eventType;
    }

    // Filter by processed status
    if (processed !== null && processed !== undefined && processed !== '') {
      where.processed = processed === 'true';
    }

    const skip = (page - 1) * limit;

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.metaWebhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          whatsappInstance: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      }),
      prisma.metaWebhookLog.count({ where }),
    ]);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStats,
      todayStats,
      errorStats,
      unprocessedStats,
    ] = await Promise.all([
      prisma.metaWebhookLog.count({
        where: { organizationId },
      }),
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          createdAt: { gte: today },
        },
      }),
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          errorMessage: { not: null },
        },
      }),
      prisma.metaWebhookLog.count({
        where: {
          organizationId,
          processed: false,
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    // Format logs with instance info
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      organizationId: log.organizationId,
      whatsappInstanceId: log.whatsappInstanceId,
      instagramInstanceId: log.instagramInstanceId,
      eventType: log.eventType,
      payload: log.payload as Record<string, unknown> | null,
      forwardedToN8n: log.forwardedToN8n,
      processed: log.processed,
      processedAt: log.processedAt?.toISOString() || null,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
      instance: log.whatsappInstance ? {
        name: log.whatsappInstance.name,
        phoneNumber: log.whatsappInstance.phoneNumber,
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          total,
          pages,
          current: page,
          limit,
        },
        stats: {
          total: totalStats,
          today: todayStats,
          errors: errorStats,
          unprocessed: unprocessedStats,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching WhatsApp logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
