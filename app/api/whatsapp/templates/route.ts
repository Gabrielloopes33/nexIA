/**
 * WhatsApp Templates API Route
 * GET: List templates (from Meta API or local database)
 * POST: Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/whatsapp';
import {
  listTemplates,
  createTemplate,
  type TemplateComponent,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface CreateTemplateRequest {
  instanceId: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
}

function validateCreateBody(body: unknown): body is CreateTemplateRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { instanceId, name, language, category, components } = body as Record<string, unknown>;

  return (
    typeof instanceId === 'string' &&
    instanceId.length > 0 &&
    typeof name === 'string' &&
    name.length > 0 &&
    typeof language === 'string' &&
    language.length > 0 &&
    (category === 'MARKETING' || category === 'UTILITY' || category === 'AUTHENTICATION') &&
    Array.isArray(components) &&
    components.length > 0
  );
}

/**
 * GET /api/whatsapp/templates
 * List templates - either from database (instanceId param) or from Meta API (accessToken + wabaId)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    
    // Check if we should fetch from database or Meta API
    const instanceId = searchParams.get('instanceId');
    const organizationId = searchParams.get('organizationId');
    const accessToken = searchParams.get('accessToken');
    const wabaId = searchParams.get('wabaId');

    // If instanceId is provided, fetch from database
    if (instanceId || organizationId) {
      const where: Record<string, unknown> = {};
      
      if (instanceId) {
        where.instanceId = instanceId;
      }
      
      if (organizationId) {
        where.instance = {
          organizationId,
        };
      }

      const templates = await prisma.whatsAppTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          instance: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          templates: templates.map((t) => ({
            id: t.id,
            templateId: t.templateId,
            name: t.name,
            language: t.language,
            status: t.status,
            category: t.category,
            components: t.components,
            body: t.body,
            header: t.header,
            footer: t.footer,
            reason: t.reason,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            instance: t.instance,
            usageCount: t._count.messages,
          })),
          source: 'database',
        },
      });
    }

    // Otherwise fetch from Meta API
    if (!accessToken || !wabaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters. Provide either instanceId/organizationId for database query, or accessToken + wabaId for Meta API',
        },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const after = searchParams.get('after') || undefined;

    const result = await listTemplates(wabaId, accessToken, limit, after);

    return NextResponse.json({
      success: true,
      data: {
        templates: result.data.map((template) => ({
          id: template.id,
          name: template.name,
          language: template.language,
          status: template.status,
          category: template.category,
          components: template.components,
        })),
        pagination: result.paging
          ? {
              cursors: result.paging.cursors,
            }
          : null,
        source: 'meta_api',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp List Templates Error:', { code, message, type });

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
        error: 'Failed to list templates',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/templates
 * Create a new message template
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!validateCreateBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: instanceId (string), name (string), language (string), category ("MARKETING" | "UTILITY" | "AUTHENTICATION"), components (array)',
        },
        { status: 400 }
      );
    }

    const { instanceId, name, language, category, components } = body;

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

    // Validate template name (alphanumeric and underscores only, must include letters)
    const validNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validNameRegex.test(name)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template name must contain only alphanumeric characters and underscores',
        },
        { status: 400 }
      );
    }

    // Create template in Meta
    const result = await createTemplate(
      instance.wabaId,
      { name, language, category, components },
      instance.accessToken
    );

    // Save template to database
    const template = await prisma.whatsAppTemplate.create({
      data: {
        instanceId,
        templateId: result.id,
        name: result.name,
        language: result.language,
        category: result.category as 'AUTHENTICATION' | 'MARKETING' | 'UTILITY',
        status: result.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED',
        components: result.components as Record<string, unknown>,
        body: extractBodyFromComponents(result.components),
        header: extractHeaderFromComponents(result.components),
        footer: extractFooterFromComponents(result.components),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        created: true,
        templateId: result.id,
        status: result.status,
        dbId: template.id,
        message: 'Template created successfully and is pending approval',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Create Template Error:', { code, message, type });

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
        error: 'Failed to create template',
      },
      { status: 500 }
    );
  }
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
