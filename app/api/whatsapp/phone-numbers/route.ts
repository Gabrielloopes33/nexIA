/**
 * WhatsApp Phone Numbers API Route
 * GET: List phone numbers
 * POST: Add phone number
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listPhoneNumbers,
  registerPhoneNumber,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface ListQueryParams {
  accessToken: string;
  wabaId: string;
}

function validateListParams(searchParams: URLSearchParams): ListQueryParams | null {
  const accessToken = searchParams.get('accessToken');
  const wabaId = searchParams.get('wabaId');

  if (!accessToken || !wabaId) {
    return null;
  }

  return { accessToken, wabaId };
}

interface AddPhoneRequest {
  accessToken: string;
  wabaId: string;
  phoneNumber: string;
  pin?: string;
}

function validateAddBody(body: unknown): body is AddPhoneRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken, wabaId, phoneNumber } = body as Record<string, unknown>;

  return (
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof wabaId === 'string' &&
    wabaId.length > 0 &&
    typeof phoneNumber === 'string' &&
    phoneNumber.length >= 10
  );
}

/**
 * GET /api/whatsapp/phone-numbers
 * List all phone numbers for a WABA
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = validateListParams(searchParams);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameters: accessToken, wabaId',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId } = params;

    const result = await listPhoneNumbers(wabaId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        phoneNumbers: result.data.map((phone) => ({
          id: phone.id,
          displayPhoneNumber: phone.display_phone_number,
          verifiedName: phone.verified_name,
          verificationStatus: phone.code_verification_status,
          qualityRating: phone.quality_rating,
        })),
        pagination: result.paging
          ? {
              cursors: result.paging.cursors,
            }
          : null,
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp List Phone Numbers Error:', { code, message, type });

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
        error: 'Failed to list phone numbers',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/phone-numbers
 * Register a new phone number
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateAddBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), wabaId (string), phoneNumber (string). Optional: pin (string)',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId, phoneNumber, pin } = body;

    const result = await registerPhoneNumber(wabaId, phoneNumber, accessToken, pin);

    return NextResponse.json({
      success: true,
      data: {
        registered: result.success,
        phoneNumberId: result.id,
        message: 'Phone number registered successfully. Verification code will be sent via SMS.',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Register Phone Number Error:', { code, message, type });

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
        error: 'Failed to register phone number',
      },
      { status: 500 }
    );
  }
}
