/**
 * @swagger
 * /api/integrations/webhooks:
 *   get:
 *     summary: Lista todos os webhooks configurados da organização
 *     tags: [Webhooks]
 *     parameters:
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
 *           enum: [active, paused, error]
 *         description: Status do webhook para filtrar
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
 *     responses:
 *       200:
 *         description: Lista de webhooks
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
 *                     $ref: '#/components/schemas/OutgoingWebhook'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Cria um novo webhook configurável
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - name
 *               - url
 *               - events
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 description: Nome do webhook
 *               url:
 *                 type: string
 *                 description: URL destino do webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Eventos que disparam o webhook
 *               headers:
 *                 type: object
 *                 description: Headers customizados
 *               retryCount:
 *                 type: integer
 *                 default: 3
 *                 description: Número de tentativas em caso de falha
 *     responses:
 *       201:
 *         description: Webhook criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */

/**
 * Outgoing Webhooks API Route
 * GET: List all outgoing webhooks for an organization
 * POST: Create a new outgoing webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

/**
 * GET /api/integrations/webhooks
 * List all outgoing webhooks for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || (user as { organization?: { id: string } }).organization?.id;
    const status = searchParams.get('status') as 'active' | 'paused' | 'error' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Construir where clause
    const where: Record<string, unknown> = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');

    // Buscar webhooks customizáveis + integrações conectadas que usam webhook de entrada
    const [customWebhooks, totalCustom, typebotIntegration, linkedInIntegration, metaInstances] = await Promise.all([
      prisma.outgoingWebhook.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.outgoingWebhook.count({ where }),
      prisma.typebotIntegration.findFirst({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.linkedInIntegration.findFirst({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.whatsAppInstance.findMany({
        where: {
          organizationId,
          status: {
            in: ['CONNECTED', 'CONNECTING'],
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const connectedIntegrationWebhooks = [
      ...(typebotIntegration
        ? [
            {
              id: `system-typebot-${typebotIntegration.id}`,
              organizationId,
              name: 'Typebot (Entrada)',
              url: `${appUrl}/api/webhooks/typebot?organizationId=${organizationId}`,
              events: ['typebot.flow.completed'],
              headers: null,
              status: 'active' as const,
              lastTriggeredAt: typebotIntegration.lastResponseAt,
              lastResponseStatus: null,
              retryCount: 0,
              createdAt: typebotIntegration.createdAt,
              updatedAt: typebotIntegration.updatedAt,
              source: 'integration' as const,
              readOnly: true,
              integrationType: 'TYPEBOT',
            },
          ]
        : []),
      ...(linkedInIntegration
        ? [
            {
              id: `system-linkedin-${linkedInIntegration.id}`,
              organizationId,
              name: 'LinkedIn Ads (Entrada)',
              url: `${appUrl}/api/webhooks/linkedin?organizationId=${organizationId}`,
              events: ['linkedin.leadgen.received'],
              headers: null,
              status: 'active' as const,
              lastTriggeredAt: linkedInIntegration.lastLeadAt,
              lastResponseStatus: null,
              retryCount: 0,
              createdAt: linkedInIntegration.createdAt,
              updatedAt: linkedInIntegration.updatedAt,
              source: 'integration' as const,
              readOnly: true,
              integrationType: 'LINKEDIN',
            },
          ]
        : []),
      ...metaInstances.map((instance) => ({
        id: `system-meta-${instance.id}`,
        organizationId,
        name: `Meta Oficial (Entrada) - ${instance.name}`,
        url: `${appUrl}/api/whatsapp/webhooks`,
        events: ['meta.whatsapp.message', 'meta.whatsapp.status'],
        headers: null,
        status: instance.status === 'CONNECTED' ? ('active' as const) : ('paused' as const),
        lastTriggeredAt: instance.connectedAt,
        lastResponseStatus: null,
        retryCount: 0,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        source: 'integration' as const,
        readOnly: true,
        integrationType: 'META',
      })),
    ];

    const webhooks = [...connectedIntegrationWebhooks, ...customWebhooks];
    const total = totalCustom + connectedIntegrationWebhooks.length;

    return NextResponse.json({
      success: true,
      data: webhooks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + webhooks.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching outgoing webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch outgoing webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/webhooks
 * Create a new outgoing webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const {
      organizationId,
      name,
      url,
      events,
      headers,
      retryCount,
    } = body;

    // Validar campos obrigatórios
    if (!organizationId || !name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, name, url, events' },
        { status: 400 }
      );
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validar eventos
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

    // Criar webhook
    const webhook = await prisma.outgoingWebhook.create({
      data: {
        organizationId,
        name: name.trim(),
        url: url.trim(),
        events,
        headers: headers || {},
        retryCount: retryCount ?? 3,
        status: 'active',
      },
    });

    // Criar log de atividade sem bloquear o fluxo principal em caso de inconsistência histórica
    try {
      await prisma.integrationActivityLog.create({
        data: {
          id: randomUUID(),
          organizationId,
          integrationType: 'WEBHOOK',
          instanceId: webhook.id,
          activityType: 'CONFIG_UPDATED',
          status: 'SUCCESS',
          title: 'Webhook criado',
          description: `Webhook "${name}" foi criado para os eventos: ${events.join(', ')}`,
        },
      });
    } catch (logError) {
      console.error('Failed to create integration activity log for webhook creation:', logError);
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating outgoing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create outgoing webhook' },
      { status: 500 }
    );
  }
}
