/**
 * WhatsApp Templates Message Send API Route
 * POST: Send a template message
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendTemplateMessage,
  WhatsAppApiError,
  extractErrorDetails,
  isValidPhoneNumber,
} from '@/lib/whatsapp/cloud-api';

interface TemplateComponentParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  video?: {
    link: string;
  };
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: TemplateComponentParameter[];
}

interface SendTemplateRequest {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode: string;
  components?: TemplateComponent[];
}

function validateSendTemplateBody(body: unknown): body is SendTemplateRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const {
    accessToken,
    phoneNumberId,
    to,
    templateName,
    languageCode,
    components,
  } = body as Record<string, unknown>;

  const hasValidBase =
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof phoneNumberId === 'string' &&
    phoneNumberId.length > 0 &&
    typeof to === 'string' &&
    to.length > 0 &&
    typeof templateName === 'string' &&
    templateName.length > 0 &&
    typeof languageCode === 'string' &&
    languageCode.length > 0;

  if (!hasValidBase) {
    return false;
  }

  // Validate components if provided
  if (components !== undefined) {
    if (!Array.isArray(components)) {
      return false;
    }

    for (const component of components) {
      if (
        typeof component !== 'object' ||
        component === null ||
        !['header', 'body', 'button'].includes((component as TemplateComponent).type) ||
        !Array.isArray((component as TemplateComponent).parameters)
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * POST /api/whatsapp/messages/templates
 * Send a WhatsApp template message
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateSendTemplateBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), phoneNumberId (string), to (string), templateName (string), languageCode (string). Optional: components (array)',
          example: {
            accessToken: 'your_access_token',
            phoneNumberId: '123456789',
            to: '5511999999999',
            templateName: 'hello_world',
            languageCode: 'pt_BR',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'John' },
                ],
              },
            ],
          },
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!isValidPhoneNumber(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format. Must be in international format (e.g., 5511999999999)',
        },
        { status: 400 }
      );
    }

    const {
      accessToken,
      phoneNumberId,
      to,
      templateName,
      languageCode,
      components,
    } = body;

    const formattedPhone = to.replace(/\D/g, '');

    const result = await sendTemplateMessage(
      phoneNumberId,
      formattedPhone,
      templateName,
      languageCode,
      accessToken,
      components
    );

    return NextResponse.json({
      success: true,
      data: {
        sent: true,
        messageId: result.messages[0]?.id,
        recipientId: result.contacts[0]?.wa_id,
        messagingProduct: result.messaging_product,
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Send Template Message Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      // Common error: template not found or not approved
      if (code === 132001) {
        return NextResponse.json(
          {
            success: false,
            error: 'Template not found or not approved. Please check the template name and language code.',
            errorCode: code,
            errorType: type,
          },
          { status: 400 }
        );
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
        error: 'Failed to send template message',
      },
      { status: 500 }
    );
  }
}
