/**
 * WhatsApp Instance Disconnect API Route
 * POST: Disconnect an instance (clear tokens, update status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/whatsapp/instances/[id]/disconnect
 * Disconnect a WhatsApp instance
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Update instance to disconnected state
    const updated = await prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: 'DISCONNECTED',
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        connectedAt: null,
      },
    });

    // Log the disconnection
    await prisma.whatsAppLog.create({
      data: {
        instanceId: id,
        type: 'instance_disconnected',
        eventType: 'manual_disconnect',
        payload: { disconnectedAt: new Date().toISOString() },
        processed: true,
        processedAt: new Date(),
      },
    });

    // Return sanitized instance
    const sanitizedInstance = {
      id: updated.id,
      name: updated.name,
      phoneNumber: updated.phoneNumber,
      status: updated.status,
      qualityRating: updated.qualityRating,
      updatedAt: updated.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Instance disconnected successfully',
      data: sanitizedInstance,
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect instance' },
      { status: 500 }
    );
  }
}
