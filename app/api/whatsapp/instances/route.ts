/**
 * WhatsApp Instances API Route
 * GET: List all WhatsApp instances for an organization
 * POST: Create a new instance (manual entry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';

/**
 * GET /api/whatsapp/instances
 * List all WhatsApp instances for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const instances = await prisma.whatsAppInstance.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            conversations: {
              where: { status: 'ACTIVE' },
            },
            templates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove sensitive data (tokens)
    const sanitizedInstances = instances.map((instance) => ({
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      status: instance.status,
      qualityRating: instance.qualityRating,
      messagingLimit: instance.messagingLimit,
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
      _count: instance._count,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedInstances,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp instances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/instances
 * Create a new WhatsApp instance (manual entry, not via embedded signup)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { organizationId, name, phoneNumber, wabaId, accessToken, phoneNumberId } = body;

    if (!organizationId || !name || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        organizationId,
        name,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        phoneNumberId: phoneNumberId || null,
        wabaId: wabaId || null,
        accessToken: accessToken || null,
        status: accessToken ? 'CONNECTED' : 'DISCONNECTED',
        qualityRating: 'UNKNOWN',
        connectedAt: accessToken ? new Date() : null,
      },
    });

    // Return sanitized instance (without tokens)
    const sanitizedInstance = {
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      status: instance.status,
      qualityRating: instance.qualityRating,
      createdAt: instance.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedInstance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}
