/**
 * @swagger
 * /api/integrations/webhooks/{id}/logs:
 *   get:
 *     summary: Retorna logs de um webhook específico
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
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
 *         description: Lista de logs do webhook
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
 *                 webhook:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       404:
 *         description: Webhook não encontrado
 *       500:
 *         description: Erro interno
 */

/**
 * Webhook Logs API Route
 * GET: Get activity logs for a specific webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/webhooks/{id}/logs
 * Get activity logs for a specific webhook
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || (user as { organization?: { id: string } }).organization?.id;
    const status = searchParams.get('status') as 'SUCCESS' | 'PENDING' | 'FAILED' | 'WARNING' | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o webhook existe
    const webhook = await prisma.outgoingWebhook.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Construir where clause
    const where: Record<string, unknown> = {
      organizationId,
      instanceId: id,
      integrationType: 'WEBHOOK',
    };

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
      webhook: {
        id: webhook.id,
        name: webhook.name,
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}
