/**
 * WhatsApp Auth Refresh API Route
 * POST: Refresh access token
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  refreshAccessToken,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface RefreshRequest {
  accessToken: string;
}

function validateRefreshBody(body: unknown): body is RefreshRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken } = body as Record<string, unknown>;

  return typeof accessToken === 'string' && accessToken.length > 0;
}

/**
 * POST /api/whatsapp/auth/refresh
 * Refresh access token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateRefreshBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string)',
        },
        { status: 400 }
      );
    }

    const { accessToken } = body;

    // Refresh the token
    const result = await refreshAccessToken(accessToken);

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();

    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.access_token,
        tokenType: result.token_type,
        expiresIn: result.expires_in,
        expiresAt,
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Token Refresh Error:', { code, message, type });

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
        error: 'Failed to refresh access token',
      },
      { status: 500 }
    );
  }
}
