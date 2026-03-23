import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/evolution/instances/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const instance = await prisma.evolutionInstance.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        instanceName: true,
        status: true,
        phoneNumber: true,
        profileName: true,
        profilePictureUrl: true,
        messagesSent: true,
        messagesReceived: true,
        connectedAt: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: instance });
  } catch (error) {
    console.error('Error fetching instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

// DELETE /api/evolution/instances/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const instance = await prisma.evolutionInstance.findFirst({
      where: { id, organizationId },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Delete from Evolution API
    try {
      await evolutionService.deleteInstance(instance.instanceName);
    } catch (error) {
      console.warn('Error deleting from Evolution API:', error);
      // Continue even if Evolution deletion fails
    }

    // Delete from database
    await prisma.evolutionInstance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
}
