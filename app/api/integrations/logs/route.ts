/**
 * Integration Activity Logs API
 * GET: Listar logs de atividades de integrações
 * POST: Criar log (para automações/webhooks)
 * DELETE: Limpar logs antigos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// GET /api/integrations/logs?type=&status=&limit=50
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const integrationType = searchParams.get('type') as any;
    const activityType = searchParams.get('activityType') as any;
    const status = searchParams.get('status') as any;
    const instanceId = searchParams.get('instanceId');
    const contactId = searchParams.get('contactId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: user.organization.id,
    };

    if (integrationType) where.integrationType = integrationType;
    if (activityType) where.activityType = activityType;
    if (status) where.status = status;
    if (instanceId) where.instanceId = instanceId;
    if (contactId) where.contactId = contactId;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.integrationActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.integrationActivityLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Integration Logs GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// POST /api/integrations/logs - Criar log
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      integrationType,
      instanceId,
      activityType,
      status,
      title,
      description,
      requestPayload,
      responsePayload,
      errorMessage,
      errorCode,
      contactId,
      dealId,
      messageId,
      durationMs,
      retryCount,
      maxRetries,
    } = body;

    // Validações
    if (!integrationType || !activityType || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: integrationType, activityType, title' },
        { status: 400 }
      );
    }

    const log = await prisma.integrationActivityLog.create({
      data: {
        organizationId: user.organization.id,
        integrationType,
        instanceId,
        activityType,
        status: status || 'SUCCESS',
        title,
        description,
        requestPayload,
        responsePayload,
        errorMessage,
        errorCode,
        contactId,
        dealId,
        messageId,
        durationMs,
        retryCount,
        maxRetries,
        completedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: log,
    }, { status: 201 });
  } catch (error) {
    console.error('Integration Logs POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create log' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/logs - Limpar logs antigos
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const days = parseInt(searchParams.get('days') || '30');
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - days);

    const result = await prisma.integrationActivityLog.deleteMany({
      where: {
        organizationId: user.organization.id,
        createdAt: {
          lt: beforeDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} logs deleted successfully`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Integration Logs DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}
