/**
 * WhatsApp Templates Sync API Route
 * POST: Synchronize templates with Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listTemplates,
  WhatsAppApiError,
  extractErrorDetails,
  type Template,
} from '@/lib/whatsapp/cloud-api';

interface SyncRequest {
  accessToken: string;
  wabaId: string;
  force?: boolean;
}

function validateSyncBody(body: unknown): body is SyncRequest {
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
 * POST /api/whatsapp/templates/sync
 * Sync templates with Meta API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateSyncBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: accessToken (string), wabaId (string). Optional: force (boolean)',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId, force } = body;

    // Fetch all templates from Meta
    const allTemplates: Template[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10; // Prevent infinite loops

    while (hasMore && pageCount < maxPages) {
      const result = await listTemplates(wabaId, accessToken, 100, after);
      
      allTemplates.push(...result.data);
      
      after = result.paging?.cursors?.after;
      hasMore = !!after;
      pageCount++;
    }

    // In a real implementation, you would:
    // 1. Compare with stored templates in your database
    // 2. Update/create/delete templates as needed
    // 3. Track sync timestamp

    // Example database operations (pseudo-code):
    // if (force) {
    //   await db.templates.deleteMany({ where: { wabaId } });
    // }
    //
    // for (const template of allTemplates) {
    //   await db.templates.upsert({
    //     where: { name_language_wabaId: { name: template.name, language: template.language, wabaId } },
    //     update: { status: template.status, components: template.components },
    //     create: { ...template, wabaId },
    //   });
    // }
    //
    // await db.syncLog.create({
    //   data: { wabaId, type: 'templates', syncedAt: new Date(), count: allTemplates.length }
    // });

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
        force,
        templates: allTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          language: t.language,
          status: t.status,
          category: t.category,
        })),
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Sync Templates Error:', { code, message, type });

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
        error: 'Failed to sync templates',
      },
      { status: 500 }
    );
  }
}
