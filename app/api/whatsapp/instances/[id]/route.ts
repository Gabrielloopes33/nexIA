/**
 * WhatsApp Instance Individual API Route
 * GET: Get a specific instance
 * PATCH: Update an instance
 * DELETE: Delete an instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/whatsapp/instances/[id]
 * Get a specific WhatsApp instance
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (!session.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organização não encontrada' },
        { status: 400 }
      );
    }

    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    // Return sanitized instance
    const sanitizedInstance = {
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      displayPhoneNumber: instance.displayPhoneNumber,
      verifiedName: instance.verifiedName,
      status: instance.status,
      qualityRating: instance.qualityRating,
      messagingLimit: instance.messagingLimit,
      messagingTier: instance.messagingTier,
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedInstance,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar instância' },
      { status: 500 }
    );
  }
}

interface UpdateInstanceRequest {
  name?: string;
  status?: string;
  qualityRating?: string;
  verifiedName?: string;
}

/**
 * PATCH /api/whatsapp/instances/[id]
 * Update a WhatsApp instance
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (!session.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organização não encontrada' },
        { status: 400 }
      );
    }

    // Check if instance exists and belongs to organization
    const existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existingInstance) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    const body: UpdateInstanceRequest = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.qualityRating !== undefined) updateData.qualityRating = body.qualityRating;
    if (body.verifiedName !== undefined) updateData.verifiedName = body.verifiedName.trim();

    const instance = await prisma.whatsAppInstance.update({
      where: { id },
      data: updateData,
    });

    // Return sanitized instance
    const sanitizedInstance = {
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      displayPhoneNumber: instance.displayPhoneNumber,
      verifiedName: instance.verifiedName,
      status: instance.status,
      qualityRating: instance.qualityRating,
      messagingLimit: instance.messagingLimit,
      messagingTier: instance.messagingTier,
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedInstance,
    });
  } catch (error) {
    console.error('Error updating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar instância' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/instances/[id]
 * Delete a WhatsApp instance
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    if (!session.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organização não encontrada' },
        { status: 400 }
      );
    }

    // Check if instance exists and belongs to organization
    const existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existingInstance) {
      return NextResponse.json(
        { success: false, error: 'Instância não encontrada' },
        { status: 404 }
      );
    }

    await prisma.whatsAppInstance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Instância removida com sucesso',
    });
  } catch (error) {
    console.error('Error deleting WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao remover instância' },
      { status: 500 }
    );
  }
}
