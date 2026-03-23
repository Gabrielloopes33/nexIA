import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/evolution/instances/[id]/status
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
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Get real-time status from Evolution API
    try {
      const state = await evolutionService.getConnectionState(instance.instanceName);
      
      // Map Evolution state to our status
      const statusMap: Record<string, string> = {
        'open': 'CONNECTED',
        'connecting': 'CONNECTING',
        'close': 'DISCONNECTED',
      };

      const mappedStatus = statusMap[state.state] || 'ERROR';

      // Update database if status changed
      if (mappedStatus !== instance.status) {
        await prisma.evolutionInstance.update({
          where: { id },
          data: {
            status: mappedStatus,
            ...(mappedStatus === 'CONNECTED' ? { connectedAt: new Date() } : {}),
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          status: mappedStatus,
          state: state.state,
          instance: state.instance,
        },
      });
    } catch (error) {
      // Return cached status if API fails
      return NextResponse.json({
        success: true,
        data: {
          status: instance.status,
          state: 'unknown',
          cached: true,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
