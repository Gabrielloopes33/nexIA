/**
 * WhatsApp Instances API Route
 * GET: List all WhatsApp instances for an organization
 * POST: Create a new instance via Embedded Signup or manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/whatsapp/instances
 * List all WhatsApp instances for the current organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
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

    const instances = await prisma.whatsAppInstance.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    // Remove sensitive data (tokens)
    const sanitizedInstances = instances.map((instance) => ({
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      displayPhoneNumber: instance.displayPhoneNumber,
      verifiedName: instance.verifiedName,
      status: instance.status,
      qualityRating: instance.qualityRating,
      messagingLimit: instance.messagingLimit,
      messagingTier: instance.messagingTier,
      isDefault: instances.length === 1 || instance.status === 'CONNECTED', // Se só tem um ou está conectado
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedInstances,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp instances:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar instâncias' },
      { status: 500 }
    );
  }
}

interface CreateInstanceRequest {
  name: string;
  phoneNumber: string;
  displayPhoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifiedName?: string;
}

/**
 * POST /api/whatsapp/instances
 * Create a new WhatsApp instance
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    const body: CreateInstanceRequest = await request.json();
    const { 
      name, 
      phoneNumber, 
      displayPhoneNumber,
      phoneNumberId, 
      wabaId, 
      accessToken,
      verifiedName,
    } = body;

    // Validate required fields
    if (!name || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Nome e número de telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if phone number already exists for this organization
    const existingInstance = await prisma.whatsAppInstance.findFirst({
      where: {
        organizationId: session.organizationId,
        phoneNumber: cleanPhoneNumber,
      },
    });

    if (existingInstance) {
      return NextResponse.json(
        { success: false, error: 'Este número de telefone já está cadastrado' },
        { status: 409 }
      );
    }

    // Create instance
    const instance = await prisma.whatsAppInstance.create({
      data: {
        organizationId: session.organizationId,
        name: name.trim(),
        phoneNumber: cleanPhoneNumber,
        displayPhoneNumber: displayPhoneNumber || phoneNumber,
        phoneNumberId: phoneNumberId || null,
        wabaId: wabaId || null,
        accessToken: accessToken || null,
        verifiedName: verifiedName || name.trim(),
        status: accessToken ? 'CONNECTED' : 'PENDING_SETUP',
        qualityRating: 'UNKNOWN',
        connectedAt: accessToken ? new Date() : null,
      },
    });

    // Return sanitized instance (without tokens)
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
      isDefault: true,
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedInstance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao criar instância' },
      { status: 500 }
    );
  }
}
