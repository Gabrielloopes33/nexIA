/**
 * WhatsApp Template Detail API Route
 * DELETE: Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  deleteTemplate,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

/**
 * DELETE /api/whatsapp/templates/[id]
 * Delete a message template by name.
 * Body: { instanceId: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: templateName } = await params;

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'Template name is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { instanceId } = body as Record<string, unknown>;

    if (typeof instanceId !== 'string' || !instanceId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Required: instanceId (string)' },
        { status: 400 }
      );
    }

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
      select: { accessToken: true, wabaId: true },
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Instance not found' },
        { status: 404 }
      );
    }

    if (!instance.accessToken || !instance.wabaId) {
      return NextResponse.json(
        { success: false, error: 'Instance is missing credentials' },
        { status: 400 }
      );
    }

    await deleteTemplate(instance.wabaId, templateName, instance.accessToken);

    return NextResponse.json({
      success: true,
      data: { deleted: true, templateName, message: 'Template deleted successfully' },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Delete Template Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        { success: false, error: message, errorCode: code, errorType: type },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
