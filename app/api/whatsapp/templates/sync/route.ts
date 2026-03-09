/**
 * WhatsApp Templates Sync API Route
 * POST: Synchronize templates with Meta and save to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';
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

// Helper functions to extract text from components
function extractBodyFromComponents(components: unknown[]): string {
  if (!Array.isArray(components)) return '';
  const bodyComponent = components.find((c: Record<string, unknown>) => c.type === 'BODY');
  return (bodyComponent?.text as string) || '';
}

function extractHeaderFromComponents(components: unknown[]): string | undefined {
  if (!Array.isArray(components)) return undefined;
  const headerComponent = components.find((c: Record<string, unknown>) => c.type === 'HEADER');
  return (headerComponent?.text as string) || undefined;
}

function extractFooterFromComponents(components: unknown[]): string | undefined {
  if (!Array.isArray(components)) return undefined;
  const footerComponent = components.find((c: Record<string, unknown>) => c.type === 'FOOTER');
  return (footerComponent?.text as string) || undefined;
}

/**
 * POST /api/whatsapp/templates/sync
 * Sync templates with Meta API and save to database
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

    const { instanceId, force } = body;

    // Fetch instance to get accessToken and wabaId
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
    const maxPages = 10; // Prevent infinite loops

    while (hasMore && pageCount < maxPages) {
      const result = await listTemplates(wabaId, accessToken, 100, after);
      
      allTemplates.push(...result.data);
      
      after = result.paging?.cursors?.after;
      hasMore = !!after;
      pageCount++;
    }

    // If force mode, delete all existing templates for this instance
    if (force) {
      await prisma.whatsAppTemplate.deleteMany({
        where: { instanceId },
      });
    }

    // Upsert templates to database
    const upsertResults = await Promise.all(
      allTemplates.map(async (template) => {
        try {
          const result = await prisma.whatsAppTemplate.upsert({
            where: {
              templateId: template.id,
            },
            update: {
              name: template.name,
              language: template.language,
              status: template.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED',
              category: template.category as 'AUTHENTICATION' | 'MARKETING' | 'UTILITY',
              components: template.components as Record<string, unknown>,
              body: extractBodyFromComponents(template.components),
              header: extractHeaderFromComponents(template.components),
              footer: extractFooterFromComponents(template.components),
              updatedAt: new Date(),
            },
            create: {
              instanceId,
              templateId: template.id,
              name: template.name,
              language: template.language,
              status: template.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED',
              category: template.category as 'AUTHENTICATION' | 'MARKETING' | 'UTILITY',
              components: template.components as Record<string, unknown>,
              body: extractBodyFromComponents(template.components),
              header: extractHeaderFromComponents(template.components),
              footer: extractFooterFromComponents(template.components),
            },
          });
          return { success: true, templateId: template.id, dbId: result.id };
        } catch (error) {
          console.error(`Failed to upsert template ${template.id}:`, error);
          return { success: false, templateId: template.id, error: String(error) };
        }
      })
    );

    const successful = upsertResults.filter((r) => r.success).length;
    const failed = upsertResults.filter((r) => !r.success).length;

    // Log sync operation
    await prisma.whatsAppLog.create({
      data: {
        instanceId,
        type: 'templates_sync',
        eventType: 'sync',
        payload: {
          totalTemplates: allTemplates.length,
          successful,
          failed,
          force,
          pageCount,
        },
        processed: true,
        processedAt: new Date(),
      },
    });

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
        upserted: successful,
        failed,
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
