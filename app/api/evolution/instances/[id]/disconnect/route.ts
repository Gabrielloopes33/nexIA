import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/evolution/instances/[id]/disconnect
export async function POST(request: NextRequest, { params }: Params) {
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

    // Disconnect from Evolution API
    await evolutionService.disconnectInstance(instance.instanceName);

    // Update database
    await prisma.evolutionInstance.update({
      where: { id },
      data: {
        status: 'DISCONNECTED',
        disconnectedAt: new Date(),
        phoneNumber: null,
        profileName: null,
        profilePictureUrl: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect instance' },
      { status: 500 }
    );
  }
}
