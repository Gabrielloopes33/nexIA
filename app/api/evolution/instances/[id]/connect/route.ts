import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/services/evolution-api';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/evolution/instances/[id]/connect
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

    // Update status to connecting
    await prisma.evolutionInstance.update({
      where: { id },
      data: { status: 'CONNECTING' },
    });

    // Try to configure webhook (in case it failed during creation)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://app.nexialab.com.br'}/api/evolution/webhook`;
    try {
      await evolutionService.setWebhook(instance.instanceName, webhookUrl);
      console.log(`[Evolution Connect] Webhook configured for ${instance.instanceName}`);
    } catch (webhookError) {
      console.warn(`[Evolution Connect] Failed to configure webhook (non-critical):`, webhookError);
    }

    // Get QR Code from Evolution API
    const qrData = await evolutionService.connectInstance(instance.instanceName);

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrData.base64,
        pairingCode: qrData.pairingCode,
        count: qrData.count,
      },
    });
  } catch (error) {
    console.error('Error connecting instance:', error);
    
    // Revert status on error
    const { id } = await params;
    await prisma.evolutionInstance.update({
      where: { id },
      data: { status: 'ERROR' },
    });

    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
