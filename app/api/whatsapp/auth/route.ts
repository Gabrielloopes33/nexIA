/**
 * WhatsApp Auth API Route
 * POST: Connect account (receive access_token, waba_id)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateAccessToken,
  getWABADetails,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

// Validation schemas
interface ConnectRequest {
  accessToken: string;
  wabaId: string;
}

function validateConnectBody(body: unknown): body is ConnectRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken, wabaId } = body as Record<string, unknown>;

  return (
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof wabaId === 'string' &&
    wabaId.length > 0
  );
}

/**
 * POST /api/whatsapp/auth
 * Connect WhatsApp Business Account
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateConnectBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), wabaId (string)',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId } = body;

    // Validate the access token
    const tokenInfo = await validateAccessToken(accessToken);

    if (!tokenInfo.is_valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid access token',
        },
        { status: 401 }
      );
    }

    // Check if token has required scopes
    const requiredScopes = ['whatsapp_business_management', 'whatsapp_business_messaging'];
    const hasRequiredScopes = requiredScopes.every((scope) =>
      tokenInfo.scopes.includes(scope)
    );

    if (!hasRequiredScopes) {
      return NextResponse.json(
        {
          success: false,
          error: `Access token missing required scopes. Required: ${requiredScopes.join(', ')}`,
        },
        { status: 403 }
      );
    }

    // Get WABA details
    const wabaDetails = await getWABADetails(wabaId, accessToken);

    // Calculate token expiration
    const expiresAt = tokenInfo.expires_at > 0
      ? new Date(tokenInfo.expires_at * 1000).toISOString()
      : null;

    const dataAccessExpiresAt = tokenInfo.data_access_expires_at > 0
      ? new Date(tokenInfo.data_access_expires_at * 1000).toISOString()
      : null;

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        waba: {
          id: wabaDetails.id,
          name: wabaDetails.name,
          timezoneId: wabaDetails.timezone_id,
          messageTemplateNamespace: wabaDetails.message_template_namespace,
        },
        token: {
          appId: tokenInfo.app_id,
          userId: tokenInfo.user_id,
          type: tokenInfo.type,
          scopes: tokenInfo.scopes,
          expiresAt,
          dataAccessExpiresAt,
        },
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Auth Error:', { code, message, type });

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
        error: 'Failed to connect WhatsApp account',
      },
      { status: 500 }
    );
  }
}
