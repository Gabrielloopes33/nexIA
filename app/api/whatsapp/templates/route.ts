/**
 * WhatsApp Templates API Route
 * GET: List templates from Meta API
 * POST: Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
 * List templates from Meta API using instance credentials
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] WhatsApp Templates API - GET request started`);
  
  try {
    const { searchParams } = request.nextUrl;

    const instanceId = searchParams.get('instanceId');
    const organizationId = searchParams.get('organizationId');
    const accessToken = searchParams.get('accessToken');
    const wabaId = searchParams.get('wabaId');

    console.log(`[${requestId}] Query params:`, { 
      instanceId, 
      organizationId, 
      hasAccessToken: !!accessToken, 
      hasWabaId: !!wabaId 
    });

    let resolvedAccessToken = accessToken;
    let resolvedWabaId = wabaId;

    // If instanceId or organizationId provided, look up credentials from DB
    if (instanceId || organizationId) {
      console.log(`[${requestId}] Looking up instance in DB...`);
      
      const where = instanceId
        ? { id: instanceId }
        : { organizationId: organizationId! };

      console.log(`[${requestId}] DB query where clause:`, where);

      try {
        const instance = await prisma.whatsAppInstance.findFirst({ where });
        console.log(`[${requestId}] DB query result:`, instance ? { 
          id: instance.id, 
          hasAccessToken: !!instance.accessToken, 
          hasWabaId: !!instance.wabaId,
          wabaId: instance.wabaId
        } : 'Instance not found');

        if (!instance) {
          console.error(`[${requestId}] Instance not found`);
          return NextResponse.json(
            { success: false, error: 'Instance not found' },
            { status: 404 }
          );
        }

        if (!instance.accessToken || !instance.wabaId) {
          console.error(`[${requestId}] Instance missing credentials`, { 
            hasAccessToken: !!instance.accessToken, 
            hasWabaId: !!instance.wabaId 
          });
          return NextResponse.json(
            { success: false, error: 'Instance is missing credentials' },
            { status: 400 }
          );
        }

        resolvedAccessToken = instance.accessToken;
        resolvedWabaId = instance.wabaId;
      } catch (dbError) {
        console.error(`[${requestId}] Database error:`, dbError);
        return NextResponse.json(
          { success: false, error: 'Database error', details: dbError instanceof Error ? dbError.message : 'Unknown DB error' },
          { status: 500 }
        );
      }
    }

    if (!resolvedAccessToken || !resolvedWabaId) {
      console.error(`[${requestId}] Missing credentials`, { 
        hasAccessToken: !!resolvedAccessToken, 
        hasWabaId: !!resolvedWabaId 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters. Provide instanceId, organizationId, or accessToken + wabaId',
        },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const after = searchParams.get('after') || undefined;

    console.log(`[${requestId}] Calling Meta API listTemplates with wabaId: ${resolvedWabaId}, limit: ${limit}`);

    try {
      const result = await listTemplates(resolvedWabaId, resolvedAccessToken, limit, after);
      console.log(`[${requestId}] Meta API response:`, { 
        templateCount: result.data?.length || 0,
        hasPaging: !!result.paging 
      });

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
            ? { cursors: result.paging.cursors }
            : null,
          source: 'meta_api',
        },
      });
    } catch (apiError) {
      console.error(`[${requestId}] Meta API error:`, apiError);
      throw apiError;
    }
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error(`[${requestId}] WhatsApp List Templates Error:`, { code, message, type, error });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        { success: false, error: message, errorCode: code, errorType: type },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to list templates', details: message },
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

    const result = await createTemplate(
      instance.wabaId,
      { name, language, category, components },
      instance.accessToken
    );

    return NextResponse.json({
      success: true,
      data: {
        created: true,
        templateId: result.id,
        status: result.status,
        message: 'Template created successfully and is pending approval',
      },
    });
  } catch (error) {
    const { code, message, type } = extractErrorDetails(error);

    console.error('WhatsApp Create Template Error:', { code, message, type });

    if (error instanceof WhatsAppApiError) {
      return NextResponse.json(
        { success: false, error: message, errorCode: code, errorType: type },
        { status: code >= 400 && code < 500 ? code : 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
