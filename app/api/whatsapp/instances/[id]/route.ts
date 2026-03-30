/**
 * WhatsApp Instance API Route
 * GET: Get a specific instance
 * DELETE: Delete an instance
 * PATCH: Update an instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            templates: true,
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const sanitizedInstance = {
      id: instance.id,
      name: instance.name,
      phoneNumber: instance.phoneNumber,
      status: instance.status,
      qualityRating: instance.qualityRating,
      messagingLimit: instance.messagingLimit,
      messagingTier: instance.messagingTier,
      connectedAt: instance.connectedAt,
      createdAt: instance.createdAt,
      _count: instance._count,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedInstance,
    });
  } catch (error) {
    console.error('Error fetching WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instance' },
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

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    await prisma.whatsAppInstance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Instance deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
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
    const body = await request.json();
    const { name, status, qualityRating } = body;

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.whatsAppInstance.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(qualityRating && { qualityRating }),
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
      data: sanitizedInstance,
    });
  } catch (error) {
    console.error('Error updating WhatsApp instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update instance' },
      { status: 500 }
    );
  }
}
