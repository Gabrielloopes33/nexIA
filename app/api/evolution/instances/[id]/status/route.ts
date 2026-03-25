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
      
      console.log(`[Evolution Status] Raw response for ${instance.instanceName}:`, JSON.stringify(state));
      
      // Evolution API v2 pode retornar diferentes formatos
      // Formato 1: { state: 'open' | 'connecting' | 'close' }
      // Formato 2: { instance: { state: 'CONNECTED', status: 'connected' } }
      
      let connectionState = state.state;
      let connectionStatus = state.status;
      
      // Se não tem state direto, tenta buscar em state.instance
      if (!connectionState && typeof state === 'object') {
        const stateObj = state as Record<string, unknown>;
        if (stateObj.instance && typeof stateObj.instance === 'object') {
          const instanceData = stateObj.instance as Record<string, unknown>;
          connectionState = instanceData.state as string || instanceData.status as string;
          connectionStatus = instanceData.status as string;
        }
      }
      
      console.log(`[Evolution Status] Extracted state: ${connectionState}, status: ${connectionStatus}`);
      
      // Map Evolution state to our status
      const statusMap: Record<string, string> = {
        'open': 'CONNECTED',
        'connected': 'CONNECTED',
        'connecting': 'CONNECTING',
        'pairing': 'CONNECTING',
        'close': 'DISCONNECTED',
        'closed': 'DISCONNECTED',
        'disconnected': 'DISCONNECTED',
      };

      const rawState = (connectionState || connectionStatus || '').toLowerCase();
      const mappedStatus = statusMap[rawState] || 'ERROR';

      console.log(`[Evolution Status] Mapped '${rawState}' -> ${mappedStatus}`);

      // Update database if status changed
      if (mappedStatus !== instance.status) {
        console.log(`[Evolution Status] Updating DB: ${instance.status} -> ${mappedStatus}`);
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
          state: connectionState || connectionStatus || 'unknown',
          raw: state,
        },
      });
    } catch (error) {
      console.error('[Evolution Status] Error fetching from API:', error);
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
