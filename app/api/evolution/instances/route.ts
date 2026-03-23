import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';
import { generateInstanceName } from '@/lib/utils/evolution';

// GET /api/evolution/instances?organizationId=xxx
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
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
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
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

// POST /api/evolution/instances
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, name } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { success: false, error: 'Organization ID and name are required' },
        { status: 400 }
      );
    }

    // Generate unique instance name
    const instanceName = generateInstanceName();

    // Create instance in Evolution API
    await evolutionService.createInstance(instanceName);

    // Create instance in database
    const instance = await prisma.evolutionInstance.create({
      data: {
        organizationId,
        name: name.trim(),
        instanceName,
        status: 'DISCONNECTED',
      },
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

    return NextResponse.json({ success: true, data: instance }, { status: 201 });
  } catch (error) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}
