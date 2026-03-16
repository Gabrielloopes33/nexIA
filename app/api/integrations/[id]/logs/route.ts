/**
 * @swagger
 * /api/integrations/{id}/logs:
 *   get:
 *     summary: Retorna logs de uma integração específica
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da integração
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [AUTH_CONNECTED, AUTH_DISCONNECTED, AUTH_REFRESHED, AUTH_FAILED, WEBHOOK_RECEIVED, WEBHOOK_SENT, MESSAGE_SENT, MESSAGE_RECEIVED, SYNC_STARTED, SYNC_COMPLETED, SYNC_FAILED, TEMPLATE_SENT, ERROR, CONFIG_UPDATED]
 *         description: Tipo de atividade para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, PENDING, FAILED, WARNING]
 *         description: Status do log
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final (ISO 8601)
 *     responses:
 *       200:
 *         description: Lista de logs da integração
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IntegrationActivityLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * Integration Logs API Route
 * GET: Get activity logs for a specific integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/{id}/logs
 * Get activity logs for a specific integration
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const activityType = searchParams.get('activityType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verificar se a integração existe (WhatsApp ou Instagram)
    const [whatsappInstance, instagramInstance] = await Promise.all([
      prisma.whatsappInstance.findFirst({
        where: { id, organizationId },
        select: { id: true, name: true },
      }),
      prisma.instagramInstance.findFirst({
        where: { id, organizationId },
        select: { id: true, name: true },
      }),
    ]);

    const instance = whatsappInstance || instagramInstance;
    
    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Construir where clause
    const where: Record<string, unknown> = {
      organizationId,
      instanceId: id,
    };

    if (activityType) {
      where.activityType = activityType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Buscar logs
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
      integration: {
        id: instance.id,
        name: instance.name,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching integration logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integration logs' },
      { status: 500 }
    );
  }
}
