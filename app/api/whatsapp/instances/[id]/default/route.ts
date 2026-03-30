/**
 * WhatsApp Instance Default API Route
 * POST: Set an instance as the default for the organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/whatsapp/instances/[id]/default
 * Set an instance as the default for the organization
 */
export async function POST(
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

    // Update instance status to CONNECTED if not already
    if (instance.status !== 'CONNECTED') {
      await prisma.whatsAppInstance.update({
        where: { id },
        data: {
          status: 'CONNECTED',
          connectedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Número definido como padrão',
      data: {
        id: instance.id,
        name: instance.name,
        phoneNumber: instance.phoneNumber,
        displayPhoneNumber: instance.displayPhoneNumber,
        verifiedName: instance.verifiedName,
        status: 'CONNECTED',
        qualityRating: instance.qualityRating,
        isDefault: true,
      },
    });
  } catch (error) {
    console.error('Error setting default WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao definir número padrão' },
      { status: 500 }
    );
  }
}
