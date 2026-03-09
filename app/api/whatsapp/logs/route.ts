/**
 * WhatsApp Logs API Route
 * GET: List webhook logs for an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';

/**
 * GET /api/whatsapp/logs
 * List webhook logs for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const instanceId = searchParams.get('instanceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const processed = searchParams.get('processed');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      instance: {
        organizationId,
      },
    };

    if (instanceId) {
      where.instanceId = instanceId;
    }

    if (type) {
      where.type = type;
    }

    if (processed !== null && processed !== undefined) {
      where.processed = processed === 'true';
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.whatsAppLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          instance: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      }),
      prisma.whatsAppLog.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          pages,
          current: page,
          limit,
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
