/**
 * WhatsApp Phone Number Verification API Route
 * POST: Request verification code or verify with OTP
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  requestVerificationCode,
  verifyPhoneNumber,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

type VerificationMethod = 'SMS' | 'VOICE';

interface RequestCodeBody {
  accessToken: string;
  method: VerificationMethod;
  locale?: string;
}

interface VerifyCodeBody {
  accessToken: string;
  code: string;
}

function isRequestCodeBody(body: Record<string, unknown>): body is RequestCodeBody {
  return (
    typeof body.accessToken === 'string' &&
    body.accessToken.length > 0 &&
    (body.method === 'SMS' || body.method === 'VOICE') &&
    (body.locale === undefined || typeof body.locale === 'string')
  );
}

function isVerifyCodeBody(body: Record<string, unknown>): body is VerifyCodeBody {
  return (
    typeof body.accessToken === 'string' &&
    body.accessToken.length > 0 &&
    typeof body.code === 'string' &&
    body.code.length >= 4
  );
}

/**
 * POST /api/whatsapp/phone-numbers/[id]/verify
 * Request verification code or verify phone number
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

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const bodyRecord = body as Record<string, unknown>;

    // Determine if this is a request for code or verification
    const isRequestCode = 'method' in bodyRecord;

    if (isRequestCode) {
      // Request verification code
      if (!isRequestCodeBody(bodyRecord)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request body. Required: accessToken (string), method ("SMS" | "VOICE"). Optional: locale (string, e.g., "pt_BR")',
          },
          { status: 400 }
        );
      }

      const { accessToken, method, locale } = bodyRecord;

      await requestVerificationCode(phoneNumberId, method, accessToken, locale);

      return NextResponse.json({
        success: true,
        data: {
          codeRequested: true,
          method,
          message: `Verification code will be sent via ${method}. Check your phone.`,
        },
      });
    }

    // Verify with code
    if (!isVerifyCodeBody(bodyRecord)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), code (string). Or for requesting code: accessToken (string), method ("SMS" | "VOICE")',
        },
        { status: 400 }
      );
    }

    const { accessToken, code } = bodyRecord;

    const result = await verifyPhoneNumber(phoneNumberId, code, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        verified: result.success,
        phoneNumberId: result.id,
        message: 'Phone number verified successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Phone Verification Error:', { code, message, type });

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
        error: 'Failed to verify phone number',
      },
      { status: 500 }
    );
  }
}
