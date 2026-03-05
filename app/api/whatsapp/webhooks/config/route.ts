/**
 * WhatsApp Webhooks Config API Route
 * GET: Get current webhook configuration
 * POST: Update webhook configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWebhookSubscriptions,
  subscribeToWebhooks,
  unsubscribeFromWebhooks,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

// Environment variables
const DEFAULT_WEBHOOK_FIELDS = [
  'messages',
  'message_template_status_update',
  'message_template_quality_update',
];

interface GetConfigQuery {
  accessToken: string;
  appId: string;
}

function validateGetParams(searchParams: URLSearchParams): GetConfigQuery | null {
  const accessToken = searchParams.get('accessToken');
  const appId = searchParams.get('appId');

  if (!accessToken || !appId) {
    return null;
  }

  return { accessToken, appId };
}

interface UpdateConfigRequest {
  accessToken: string;
  appId: string;
  callbackUrl: string;
  verifyToken: string;
  fields?: string[];
}

function validateUpdateBody(body: unknown): body is UpdateConfigRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken, appId, callbackUrl, verifyToken } = body as Record<string, unknown>;

  return (
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof appId === 'string' &&
    appId.length > 0 &&
    typeof callbackUrl === 'string' &&
    callbackUrl.length > 0 &&
    typeof verifyToken === 'string' &&
    verifyToken.length > 0
  );
}

interface DeleteConfigRequest {
  accessToken: string;
  appId: string;
}

function validateDeleteBody(body: unknown): body is DeleteConfigRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { accessToken, appId } = body as Record<string, unknown>;

  return (
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof appId === 'string' &&
    appId.length > 0
  );
}

/**
 * GET /api/whatsapp/webhooks/config
 * Get current webhook subscriptions
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = validateGetParams(searchParams);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameters: accessToken, appId',
        },
        { status: 400 }
      );
    }

    const { accessToken, appId } = params;

    const subscriptions = await getWebhookSubscriptions(appId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions.data.map((sub) => ({
          object: sub.object,
          callbackUrl: sub.callback_url,
          fields: sub.fields,
          active: sub.active,
        })),
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Get Webhook Config Error:', { code, message, type });

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
        error: 'Failed to get webhook configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/webhooks/config
 * Subscribe to webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateUpdateBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), appId (string), callbackUrl (string), verifyToken (string). Optional: fields (string[])',
        },
        { status: 400 }
      );
    }

    const { accessToken, appId, callbackUrl, verifyToken, fields } = body;

    // Use default fields if not provided
    const webhookFields = fields || DEFAULT_WEBHOOK_FIELDS;

    // Validate callback URL
    try {
      new URL(callbackUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid callback URL format',
        },
        { status: 400 }
      );
    }

    await subscribeToWebhooks(
      appId,
      callbackUrl,
      verifyToken,
      webhookFields,
      accessToken
    );

    return NextResponse.json({
      success: true,
      data: {
        subscribed: true,
        callbackUrl,
        fields: webhookFields,
        message: 'Webhook subscription created successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Subscribe Webhook Error:', { code, message, type });

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
        error: 'Failed to subscribe to webhooks',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/webhooks/config
 * Unsubscribe from webhooks
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateDeleteBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), appId (string)',
        },
        { status: 400 }
      );
    }

    const { accessToken, appId } = body;

    await unsubscribeFromWebhooks(appId, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        unsubscribed: true,
        message: 'Webhook subscription removed successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Unsubscribe Webhook Error:', { code, message, type });

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
        error: 'Failed to unsubscribe from webhooks',
      },
      { status: 500 }
    );
  }
}
