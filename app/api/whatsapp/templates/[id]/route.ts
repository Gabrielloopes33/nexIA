/**
 * WhatsApp Template Detail API Route
 * DELETE: Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteTemplate,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface DeleteTemplateRequest {
  accessToken: string;
  wabaId: string;
  confirm?: boolean;
}

function validateDeleteBody(body: unknown): body is DeleteTemplateRequest {
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
 * DELETE /api/whatsapp/templates/[id]
 * Delete a message template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: templateName } = await params;

    if (!templateName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template name is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!validateDeleteBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), wabaId (string). Optional: confirm (boolean)',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId, confirm } = body;

    // Require explicit confirmation
    if (confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Set confirm: true to delete this template',
        },
        { status: 400 }
      );
    }

    await deleteTemplate(wabaId, templateName, accessToken);

    return NextResponse.json({
      success: true,
      data: {
        deleted: true,
        templateName,
        message: 'Template deleted successfully',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Delete Template Error:', { code, message, type });

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
        error: 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
