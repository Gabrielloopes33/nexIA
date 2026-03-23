import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

// POST /api/evolution/messages/send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instanceId, organizationId, phone, message } = body;

    if (!instanceId || !organizationId || !phone || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.evolutionInstance.findFirst({
      where: { id: instanceId, organizationId },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (instance.status !== 'CONNECTED') {
      return NextResponse.json(
        { success: false, error: 'Instance is not connected' },
        { status: 400 }
      );
    }

    // Send message via Evolution API
    const result = await evolutionService.sendText(
      instance.instanceName,
      phone,
      message
    );

    // Increment message counter
    await prisma.evolutionInstance.update({
      where: { id: instanceId },
      data: {
        messagesSent: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.key.id,
        status: result.status || 'sent',
        timestamp: result.messageTimestamp,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
