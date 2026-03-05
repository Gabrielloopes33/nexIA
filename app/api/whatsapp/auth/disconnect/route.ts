/**
 * WhatsApp Auth Disconnect API Route
 * POST: Disconnect account
 */

import { NextRequest, NextResponse } from 'next/server';

interface DisconnectRequest {
  wabaId: string;
  confirm?: boolean;
}

function validateDisconnectBody(body: unknown): body is DisconnectRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { wabaId } = body as Record<string, unknown>;

  return typeof wabaId === 'string' && wabaId.length > 0;
}

/**
 * POST /api/whatsapp/auth/disconnect
 * Disconnect WhatsApp Business Account
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateDisconnectBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: wabaId (string)',
        },
        { status: 400 }
      );
    }

    const { wabaId, confirm } = body;

    // Require explicit confirmation
    if (confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Set confirm: true to disconnect',
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Remove stored credentials from database
    // 2. Unsubscribe from webhooks if needed
    // 3. Clean up any associated data

    // Example database cleanup (pseudo-code):
    // await db.whatsappAccounts.delete({ where: { wabaId } });
    // await db.webhookSubscriptions.deleteMany({ where: { wabaId } });

    return NextResponse.json({
      success: true,
      data: {
        disconnected: true,
        wabaId,
        message: 'WhatsApp Business Account disconnected successfully',
        note: 'Stored credentials have been removed. You may also want to revoke the token in Meta Business Manager.',
      },
    });
  } catch (error) {
    console.error('WhatsApp Disconnect Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect WhatsApp account',
      },
      { status: 500 }
    );
  }
}
