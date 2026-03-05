/**
 * WhatsApp Status API Route
 * GET: Check connection status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateAccessToken,
  getWABADetails,
  listPhoneNumbers,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface StatusQueryParams {
  accessToken: string;
  wabaId: string;
}

function validateQueryParams(searchParams: URLSearchParams): StatusQueryParams | null {
  const accessToken = searchParams.get('accessToken');
  const wabaId = searchParams.get('wabaId');

  if (!accessToken || !wabaId) {
    return null;
  }

  return { accessToken, wabaId };
}

/**
 * GET /api/whatsapp/status
 * Check WhatsApp Business Account connection status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = validateQueryParams(searchParams);

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

    // Validate token
    const tokenInfo = await validateAccessToken(accessToken);

    if (!tokenInfo.is_valid) {
      return NextResponse.json(
        {
          success: true,
          data: {
            connected: false,
            status: 'disconnected',
            reason: 'invalid_token',
            message: 'Access token is invalid or expired',
          },
        },
        { status: 200 }
      );
    }

    // Get WABA details
    let wabaDetails;
    try {
      wabaDetails = await getWABADetails(wabaId, accessToken);
    } catch (wabaError) {
      return NextResponse.json(
        {
          success: true,
          data: {
            connected: false,
            status: 'error',
            reason: 'waba_not_found',
            message: 'WhatsApp Business Account not found or access denied',
          },
        },
        { status: 200 }
      );
    }

    // Get phone numbers
    let phoneNumbers;
    try {
      const phoneResult = await listPhoneNumbers(wabaId, accessToken);
      phoneNumbers = phoneResult.data;
    } catch {
      phoneNumbers = [];
    }

    // Calculate token expiration
    const now = Date.now() / 1000;
    const tokenExpiresAt = tokenInfo.expires_at > 0 ? tokenInfo.expires_at : null;
    const dataAccessExpiresAt = tokenInfo.data_access_expires_at > 0
      ? tokenInfo.data_access_expires_at
      : null;

    const tokenStatus = {
      valid: true,
      expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt * 1000).toISOString() : null,
      dataAccessExpiresAt: dataAccessExpiresAt
        ? new Date(dataAccessExpiresAt * 1000).toISOString()
        : null,
      expiresSoon: tokenExpiresAt ? tokenExpiresAt - now < 86400 * 7 : false, // Less than 7 days
      scopes: tokenInfo.scopes,
    };

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        status: 'connected',
        timestamp: new Date().toISOString(),
        waba: {
          id: wabaDetails.id,
          name: wabaDetails.name,
          timezoneId: wabaDetails.timezone_id,
          messageTemplateNamespace: wabaDetails.message_template_namespace,
        },
        token: tokenStatus,
        phoneNumbers: phoneNumbers.map((phone) => ({
          id: phone.id,
          displayPhoneNumber: phone.display_phone_number,
          verifiedName: phone.verified_name,
          status: phone.code_verification_status,
          qualityRating: phone.quality_rating,
        })),
        metrics: {
          totalPhoneNumbers: phoneNumbers.length,
          verifiedPhoneNumbers: phoneNumbers.filter(
            (p) => p.code_verification_status === 'VERIFIED'
          ).length,
        },
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Status Check Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      // Return disconnected status for auth errors
      if (code === 190 || code === 401 || code === 403) {
        return NextResponse.json({
          success: true,
          data: {
            connected: false,
            status: 'disconnected',
            reason: 'authentication_failed',
            message: message,
          },
        });
      }

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
        error: 'Failed to check status',
      },
      { status: 500 }
    );
  }
}
