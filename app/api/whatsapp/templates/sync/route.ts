/**
 * WhatsApp Templates Sync API Route
 * POST: Fetch all templates from Meta API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  listTemplates,
  WhatsAppApiError,
  extractErrorDetails,
  type Template,
} from '@/lib/whatsapp/cloud-api';

interface SyncRequest {
  instanceId: string;
  force?: boolean;
}

function validateSyncBody(body: unknown): body is SyncRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { instanceId } = body as Record<string, unknown>;

  return typeof instanceId === 'string' && instanceId.length > 0;
}

/**
 * POST /api/whatsapp/templates/sync
 * Fetch all templates from Meta API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateSyncBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: instanceId (string). Optional: force (boolean)',
        },
        { status: 400 }
      );
    }

    const { instanceId } = body;

    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId },
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

    const { accessToken, wabaId } = instance;

    // Fetch all templates from Meta
    const allTemplates: Template[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10;

    while (hasMore && pageCount < maxPages) {
      const result = await listTemplates(wabaId, accessToken, 100, after);

      allTemplates.push(...result.data);

      after = result.paging?.cursors?.after;
      hasMore = !!after;
      pageCount++;
    }

    const statusCounts = allTemplates.reduce((acc, template) => {
      acc[template.status] = (acc[template.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = allTemplates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        synced: true,
        totalTemplates: allTemplates.length,
        pageCount,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        templates: allTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          language: t.language,
          status: t.status,
          category: t.category,
          components: t.components,
        })),
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Sync Templates Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        { success: false, error: message, errorCode: code, errorType: type },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to sync templates' },
      { status: 500 }
    );
  }
}
