/**
 * @swagger
 * /api/integrations/{id}:
 *   get:
 *     summary: Retorna uma integração específica
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
 *     responses:
 *       200:
 *         description: Detalhes da integração
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
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Integração não encontrada
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
 *   patch:
 *     summary: Atualiza status/config da integração
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da integração
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [CONNECTED, DISCONNECTED, ERROR, CONNECTING, PENDING_SETUP]
 *               settings:
 *                 type: object
 *               webhookUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Integração atualizada
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
 *       404:
 *         description: Integração não encontrada
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
 *   delete:
 *     summary: Remove uma integração
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
 *     responses:
 *       200:
 *         description: Integração removida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Integração não encontrada
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
 * Integration Detail API Route
 * GET: Get a specific integration
 * PATCH: Update integration status/config
 * DELETE: Remove integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type IntegrationType = 'whatsapp' | 'instagram';

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/integrations/{id}
 * Get a specific integration by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Tentar encontrar em WhatsApp instances primeiro
    const whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { id, organizationId },
    });

    if (whatsappInstance) {
      const integration: IntegrationItem = {
        id: whatsappInstance.id,
        type: 'whatsapp',
        name: whatsappInstance.name,
        status: whatsappInstance.status,
        phoneNumber: whatsappInstance.phoneNumber,
        displayPhoneNumber: whatsappInstance.displayPhoneNumber || undefined,
        verifiedName: whatsappInstance.verifiedName || undefined,
        connectedAt: whatsappInstance.connectedAt,
        lastSyncAt: whatsappInstance.lastSyncAt,
        errorMessage: whatsappInstance.errorMessage,
        qualityRating: whatsappInstance.qualityRating || undefined,
        organizationId: whatsappInstance.organizationId,
        createdAt: whatsappInstance.createdAt,
        updatedAt: whatsappInstance.updatedAt,
        settings: whatsappInstance.settings as Record<string, unknown> || {},
      };

      return NextResponse.json({
        success: true,
        data: integration,
      });
    }

    // Tentar encontrar em Instagram instances
    const instagramInstance = await prisma.instagramInstance.findFirst({
      where: { id, organizationId },
    });

    if (instagramInstance) {
      const integration: IntegrationItem = {
        id: instagramInstance.id,
        type: 'instagram',
        name: instagramInstance.name,
        status: instagramInstance.status,
        username: instagramInstance.username || undefined,
        profilePictureUrl: instagramInstance.profilePictureUrl || undefined,
        connectedAt: instagramInstance.connectedAt,
        lastSyncAt: instagramInstance.lastSyncAt,
        organizationId: instagramInstance.organizationId,
        createdAt: instagramInstance.createdAt,
        updatedAt: instagramInstance.updatedAt,
        settings: instagramInstance.settings as Record<string, unknown> || {},
      };

      return NextResponse.json({
        success: true,
        data: integration,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Integration not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/integrations/{id}
 * Update integration status/config
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, status, settings } = body;

    // Verificar se existe em WhatsApp
    const whatsappInstance = await prisma.whatsappInstance.findUnique({
      where: { id },
    });

    if (whatsappInstance) {
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (status !== undefined) updateData.status = status;
      if (settings !== undefined) updateData.settings = settings;

      const updated = await prisma.whatsappInstance.update({
        where: { id },
        data: updateData,
      });

      // Criar log de atividade
      await prisma.integrationActivityLog.create({
        data: {
          organizationId: updated.organizationId,
          integrationType: 'WHATSAPP',
          instanceId: updated.id,
          activityType: 'CONFIG_UPDATED',
          status: 'SUCCESS',
          title: 'Configuração atualizada',
          description: name ? `Nome alterado para ${name}` : 'Configurações atualizadas',
        },
      });

      const integration: IntegrationItem = {
        id: updated.id,
        type: 'whatsapp',
        name: updated.name,
        status: updated.status,
        phoneNumber: updated.phoneNumber,
        displayPhoneNumber: updated.displayPhoneNumber || undefined,
        verifiedName: updated.verifiedName || undefined,
        connectedAt: updated.connectedAt,
        lastSyncAt: updated.lastSyncAt,
        errorMessage: updated.errorMessage,
        qualityRating: updated.qualityRating || undefined,
        organizationId: updated.organizationId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        settings: updated.settings as Record<string, unknown> || {},
      };

      return NextResponse.json({
        success: true,
        data: integration,
      });
    }

    // Verificar se existe em Instagram
    const instagramInstance = await prisma.instagramInstance.findUnique({
      where: { id },
    });

    if (instagramInstance) {
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (status !== undefined) updateData.status = status;
      if (settings !== undefined) updateData.settings = settings;

      const updated = await prisma.instagramInstance.update({
        where: { id },
        data: updateData,
      });

      // Criar log de atividade
      await prisma.integrationActivityLog.create({
        data: {
          organizationId: updated.organizationId,
          integrationType: 'INSTAGRAM',
          instanceId: updated.id,
          activityType: 'CONFIG_UPDATED',
          status: 'SUCCESS',
          title: 'Configuração atualizada',
          description: name ? `Nome alterado para ${name}` : 'Configurações atualizadas',
        },
      });

      const integration: IntegrationItem = {
        id: updated.id,
        type: 'instagram',
        name: updated.name,
        status: updated.status,
        username: updated.username || undefined,
        profilePictureUrl: updated.profilePictureUrl || undefined,
        connectedAt: updated.connectedAt,
        lastSyncAt: updated.lastSyncAt,
        organizationId: updated.organizationId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        settings: updated.settings as Record<string, unknown> || {},
      };

      return NextResponse.json({
        success: true,
        data: integration,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Integration not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/{id}
 * Remove an integration
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Tentar deletar de WhatsApp primeiro
    const whatsappInstance = await prisma.whatsappInstance.findFirst({
      where: { id, organizationId },
    });

    if (whatsappInstance) {
      // Criar log antes de deletar
      await prisma.integrationActivityLog.create({
        data: {
          organizationId,
          integrationType: 'WHATSAPP',
          instanceId: id,
          activityType: 'AUTH_DISCONNECTED',
          status: 'SUCCESS',
          title: 'Integração removida',
          description: `Integração ${whatsappInstance.name} foi removida`,
        },
      });

      await prisma.whatsappInstance.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Integration deleted successfully',
      });
    }

    // Tentar deletar de Instagram
    const instagramInstance = await prisma.instagramInstance.findFirst({
      where: { id, organizationId },
    });

    if (instagramInstance) {
      // Criar log antes de deletar
      await prisma.integrationActivityLog.create({
        data: {
          organizationId,
          integrationType: 'INSTAGRAM',
          instanceId: id,
          activityType: 'AUTH_DISCONNECTED',
          status: 'SUCCESS',
          title: 'Integração removida',
          description: `Integração ${instagramInstance.name} foi removida`,
        },
      });

      await prisma.instagramInstance.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Integration deleted successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Integration not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
