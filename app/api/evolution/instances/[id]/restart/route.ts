import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/evolution/instances/[id]/restart
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

    // Restart instance in Evolution API
    await evolutionService.restartInstance(instance.instanceName);

    // Update database status
    await prisma.evolutionInstance.update({
      where: { id },
      data: {
        status: 'CONNECTING',
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      data: {
        message: 'Instance restarted successfully',
        instanceName: instance.instanceName,
      }
    });
  } catch (error) {
    console.error('Error restarting instance:', error);
    
    // Update status to error
    const { id } = await params;
    await prisma.evolutionInstance.update({
      where: { id },
      data: { status: 'ERROR' },
    });

    return NextResponse.json(
      { success: false, error: 'Failed to restart instance' },
      { status: 500 }
    );
  }
}
