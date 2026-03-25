import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/evolution/instances/connected?organizationId=xxx
// Retorna apenas instâncias conectadas para uso em conversas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const instances = await prisma.evolutionInstance.findMany({
      where: { 
        organizationId,
        status: 'CONNECTED'
      },
      orderBy: { lastActivityAt: 'desc' },
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

    return NextResponse.json({ success: true, data: instances });
  } catch (error) {
    console.error('Error fetching connected instances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connected instances' },
      { status: 500 }
    );
  }
}
