/**
 * @swagger
 * /api/integrations/webhooks/{id}:
 *   get:
 *     summary: Retorna um webhook específico
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
 *     responses:
 *       200:
 *         description: Detalhes do webhook
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OutgoingWebhook'
 *       404:
 *         description: Webhook não encontrado
 *       500:
 *         description: Erro interno
 *   put:
 *     summary: Atualiza um webhook existente
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               headers:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, paused, error]
 *               retryCount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Webhook atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Webhook não encontrado
 *       500:
 *         description: Erro interno
 *   delete:
 *     summary: Remove um webhook
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Webhook removido
 *       404:
 *         description: Webhook não encontrado
 *       500:
 *         description: Erro interno
 */

/**
 * Outgoing Webhook Detail API Route
 * GET: Get a specific webhook
 * PUT: Update webhook
 * DELETE: Remove webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/webhooks/{id}
 * Get a specific outgoing webhook
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

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const webhook = await prisma.outgoingWebhook.findFirst({
      where: { id, organizationId },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error('Error fetching outgoing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outgoing webhook' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/webhooks/{id}
 * Update an outgoing webhook
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const {
      name,
      url,
      events,
      headers,
      status,
      retryCount,
    } = body;

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || (user as { organization?: { id: string } }).organization?.id;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o webhook existe
    const existingWebhook = await prisma.outgoingWebhook.findFirst({
      where: { id, organizationId },
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Validar URL se fornecida
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validar eventos se fornecidos
    if (events) {
      const validEvents = [
        'contact.created',
        'contact.updated',
        'contact.deleted',
        'deal.created',
        'deal.updated',
        'deal.won',
        'deal.lost',
        'deal.stage_changed',
        'message.received',
        'message.sent',
        'schedule.created',
        'schedule.completed',
        'campaign.started',
        'campaign.completed',
      ];

      const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid events: ${invalidEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Construir dados de atualização
    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (events !== undefined) updateData.events = events;
    if (headers !== undefined) updateData.headers = headers;
    if (status !== undefined) updateData.status = status;
    if (retryCount !== undefined) updateData.retryCount = retryCount;

    const webhook = await prisma.outgoingWebhook.update({
      where: { id },
      data: updateData,
    });

    // Criar log de atividade sem bloquear atualização em caso de inconsistência histórica
    try {
      await prisma.integrationActivityLog.create({
        data: {
          id: randomUUID(),
          organizationId,
          integrationType: 'WEBHOOK',
          instanceId: webhook.id,
          activityType: 'CONFIG_UPDATED',
          status: 'SUCCESS',
          title: 'Webhook atualizado',
          description: name ? `Webhook renomeado para "${name}"` : 'Configurações do webhook atualizadas',
        },
      });
    } catch (logError) {
      console.error('Failed to create integration activity log for webhook update:', logError);
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error('Error updating outgoing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update outgoing webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/webhooks/{id}
 * Remove an outgoing webhook
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || (user as { organization?: { id: string } }).organization?.id;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o webhook existe
    const webhook = await prisma.outgoingWebhook.findFirst({
      where: { id, organizationId },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Criar log antes de deletar sem bloquear a exclusão
    try {
      await prisma.integrationActivityLog.create({
        data: {
          id: randomUUID(),
          organizationId,
          integrationType: 'WEBHOOK',
          instanceId: id,
          activityType: 'AUTH_DISCONNECTED',
          status: 'SUCCESS',
          title: 'Webhook removido',
          description: `Webhook "${webhook.name}" foi removido`,
        },
      });
    } catch (logError) {
      console.error('Failed to create integration activity log for webhook deletion:', logError);
    }

    await prisma.outgoingWebhook.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting outgoing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete outgoing webhook' },
      { status: 500 }
    );
  }
}
