/**
 * WhatsApp Phone Number Detail API Route
 * DELETE: Remove phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deregisterPhoneNumber,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface DeletePhoneRequest {
  accessToken: string;
  confirm?: boolean;
}

function validateDeleteBody(body: unknown): body is DeletePhoneRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken } = body as Record<string, unknown>;

  return typeof accessToken === 'string' && accessToken.length > 0;
}

/**
 * DELETE /api/whatsapp/phone-numbers/[id]
 * Deregister/remove a phone number
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: phoneNumberId } = await params;

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number ID is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!validateDeleteBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string). Optional: confirm (boolean)',
        },
        { status: 400 }
      );
    }

    const { accessToken, confirm } = body;

    // Require explicit confirmation
    if (confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Set confirm: true to deregister this phone number',
        },
        { status: 400 }
      );
    }

    const result = await deregisterPhoneNumber(phoneNumberId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        deregistered: result.success,
        phoneNumberId,
        message: 'Phone number deregistered successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Deregister Phone Number Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          errorCode: code,
          errorType: type,
        },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deregister phone number',
      },
      { status: 500 }
    );
  }
}
