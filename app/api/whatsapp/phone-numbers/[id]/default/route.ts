/**
 * WhatsApp Phone Number Default API Route
 * POST: Set phone number as default for WABA
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  setDefaultPhoneNumber,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface SetDefaultRequest {
  accessToken: string;
}

function validateBody(body: unknown): body is SetDefaultRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken } = body as Record<string, unknown>;

  return typeof accessToken === 'string' && accessToken.length > 0;
}

/**
 * POST /api/whatsapp/phone-numbers/[id]/default
 * Set phone number as default
 */
export async function POST(
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

    const body = await request.json();

    if (!validateBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string)',
        },
        { status: 400 }
      );
    }

    const { accessToken } = body;

    const result = await setDefaultPhoneNumber(phoneNumberId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        setAsDefault: result.success,
        phoneNumberId,
        message: 'Phone number set as default successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Set Default Phone Number Error:', { code, message, type });

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
        error: 'Failed to set default phone number',
      },
      { status: 500 }
    );
  }
}
