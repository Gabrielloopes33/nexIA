/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Lista todas as integrações da organização
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [whatsapp, instagram, n8n, webhook, api]
 *         description: Tipo de integração para filtrar
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONNECTED, DISCONNECTED, ERROR, CONNECTING, PENDING_SETUP]
 *         description: Status da integração
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
 *         description: Lista de integrações
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
 *                     $ref: '#/components/schemas/Integration'
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
 *   post:
 *     summary: Cria uma nova integração (WhatsApp ou Instagram)
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - type
 *               - name
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [whatsapp, instagram]
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *                 description: Para integrações WhatsApp
 *               pageId:
 *                 type: string
 *                 description: Para integrações Instagram
 *               instagramBusinessAccountId:
 *                 type: string
 *                 description: Para integrações Instagram
 *     responses:
 *       201:
 *         description: Integração criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       400:
 *         description: Dados inválidos
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
 * Integrations API Route
 * GET: List all integrations for an organization
 * POST: Create a new integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type IntegrationType = 'whatsapp' | 'instagram' | 'linkedin' | 'calendly' | 'n8n' | 'webhook' | 'api';

interface IntegrationItem {
  id: string;
  type: IntegrationType;
  name: string;
  status: string;
  phoneNumber?: string;
  username?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  profilePictureUrl?: string;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
  errorMessage?: string | null;
  qualityRating?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: Record<string, unknown> | null;
}

/**
 * GET /api/integrations
 * List all integrations for an organization (WhatsApp + Instagram)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type') as IntegrationType | null;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Buscar WhatsApp instances
    const whatsappWhere: Record<string, unknown> = { organizationId };
    if (status) {
      whatsappWhere.status = status;
    }

    // Buscar Instagram instances
    const instagramWhere: Record<string, unknown> = { organizationId };
    if (status) {
      instagramWhere.status = status;
    }

    // Buscar LinkedIn
    const linkedInWhere: Record<string, unknown> = { organizationId };
    if (status) linkedInWhere.status = status;

    // Buscar Calendly
    const calendlyWhere: Record<string, unknown> = { organizationId };
    if (status) calendlyWhere.status = status;

    // Buscar em paralelo
    const [whatsappInstances, instagramInstances, linkedInIntegration, calendlyIntegration] = await Promise.all([
      (!type || type === 'whatsapp')
        ? prisma.whatsappInstance.findMany({
            where: whatsappWhere,
            orderBy: { updatedAt: 'desc' },
          })
        : [],
      (!type || type === 'instagram')
        ? prisma.instagramInstance.findMany({
            where: instagramWhere,
            orderBy: { updatedAt: 'desc' },
          })
        : [],
      (!type || type === 'linkedin')
        ? prisma.linkedInIntegration.findFirst({ where: linkedInWhere })
        : null,
      (!type || type === 'calendly')
        ? prisma.calendlyIntegration.findFirst({ where: calendlyWhere })
        : null,
    ]);

    // Combinar resultados
    const integrations: IntegrationItem[] = [
      ...(calendlyIntegration ? [{
        id: calendlyIntegration.id,
        type: 'calendly' as IntegrationType,
        name: calendlyIntegration.calendlyUserName ?? 'Calendly',
        status: calendlyIntegration.status === 'ACTIVE' ? 'connected' : 'not_connected',
        username: calendlyIntegration.calendlyUserEmail ?? undefined,
        connectedAt: calendlyIntegration.createdAt,
        lastSyncAt: calendlyIntegration.lastBookingAt ?? null,
        organizationId: calendlyIntegration.organizationId,
        createdAt: calendlyIntegration.createdAt,
        updatedAt: calendlyIntegration.updatedAt,
        settings: {
          totalBookings: calendlyIntegration.totalBookings,
        },
      } satisfies IntegrationItem] : []),
      ...(linkedInIntegration ? [{
        id: linkedInIntegration.id,
        type: 'linkedin' as IntegrationType,
        name: linkedInIntegration.linkedInMemberName ?? 'LinkedIn Lead Gen Forms',
        status: linkedInIntegration.status,
        username: linkedInIntegration.linkedInMemberEmail ?? undefined,
        connectedAt: linkedInIntegration.createdAt,
        lastSyncAt: linkedInIntegration.lastLeadAt ?? null,
        organizationId: linkedInIntegration.organizationId,
        createdAt: linkedInIntegration.createdAt,
        updatedAt: linkedInIntegration.updatedAt,
        settings: {
          adAccountId: linkedInIntegration.adAccountId,
          totalLeads: linkedInIntegration.totalLeads,
        },
      } satisfies IntegrationItem] : []),
      ...whatsappInstances.map((w): IntegrationItem => ({
        id: w.id,
        type: 'whatsapp',
        name: w.name,
        status: w.status,
        phoneNumber: w.phoneNumber,
        displayPhoneNumber: w.displayPhoneNumber || undefined,
        verifiedName: w.verifiedName || undefined,
        connectedAt: w.connectedAt,
        lastSyncAt: w.lastSyncAt,
        errorMessage: w.errorMessage,
        qualityRating: w.qualityRating || undefined,
        organizationId: w.organizationId,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        settings: w.settings as Record<string, unknown> || {},
      })),
      ...instagramInstances.map((i): IntegrationItem => ({
        id: i.id,
        type: 'instagram',
        name: i.name,
        status: i.status,
        username: i.username || undefined,
        profilePictureUrl: i.profilePictureUrl || undefined,
        connectedAt: i.connectedAt,
        lastSyncAt: i.lastSyncAt,
        organizationId: i.organizationId,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        settings: i.settings as Record<string, unknown> || {},
      })),
    ];

    // Ordenar por updatedAt desc
    integrations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Aplicar paginação
    const total = integrations.length;
    const paginatedData = integrations.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + paginatedData.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Create a new integration (WhatsApp or Instagram)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      organizationId,
      type,
      name,
      phoneNumber,
      pageId,
      instagramBusinessAccountId,
    } = body;

    // Validate required fields
    if (!organizationId || !type || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, type, name' },
        { status: 400 }
      );
    }

    let integration: IntegrationItem;

    if (type === 'whatsapp') {
      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, error: 'phoneNumber is required for WhatsApp integrations' },
          { status: 400 }
        );
      }

      const instance = await prisma.whatsappInstance.create({
        data: {
          organizationId,
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          status: 'PENDING_SETUP',
        },
      });

      integration = {
        id: instance.id,
        type: 'whatsapp',
        name: instance.name,
        status: instance.status,
        phoneNumber: instance.phoneNumber,
        connectedAt: instance.connectedAt,
        lastSyncAt: instance.lastSyncAt,
        organizationId: instance.organizationId,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        settings: instance.settings as Record<string, unknown> || {},
      };
    } else if (type === 'instagram') {
      if (!pageId || !instagramBusinessAccountId) {
        return NextResponse.json(
          { success: false, error: 'pageId and instagramBusinessAccountId are required for Instagram integrations' },
          { status: 400 }
        );
      }

      const instance = await prisma.instagramInstance.create({
        data: {
          organizationId,
          name: name.trim(),
          pageId: pageId.trim(),
          instagramBusinessAccountId: instagramBusinessAccountId.trim(),
          status: 'DISCONNECTED',
        },
      });

      integration = {
        id: instance.id,
        type: 'instagram',
        name: instance.name,
        status: instance.status,
        connectedAt: instance.connectedAt,
        lastSyncAt: instance.lastSyncAt,
        organizationId: instance.organizationId,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        settings: instance.settings as Record<string, unknown> || {},
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid integration type. Supported: whatsapp, instagram' },
        { status: 400 }
      );
    }

    // Criar log de atividade
    await prisma.integrationActivityLog.create({
      data: {
        organizationId,
        integrationType: type.toUpperCase() as 'WHATSAPP' | 'INSTAGRAM',
        instanceId: integration.id,
        activityType: 'AUTH_CONNECTED',
        status: 'PENDING',
        title: `Integração ${type} criada`,
        description: `Integração ${name} foi criada e está aguardando configuração`,
      },
    });

    return NextResponse.json({
      success: true,
      data: integration,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
