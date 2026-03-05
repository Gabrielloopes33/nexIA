/**
 * WhatsApp Templates API Route
 * GET: List templates
 * POST: Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listTemplates,
  createTemplate,
  type TemplateComponent,
  WhatsAppApiError,
  extractErrorDetails,
} from '@/lib/whatsapp/cloud-api';

interface ListQueryParams {
  accessToken: string;
  wabaId: string;
  limit?: string;
  after?: string;
}

function validateListParams(searchParams: URLSearchParams): ListQueryParams | null {
  const accessToken = searchParams.get('accessToken');
  const wabaId = searchParams.get('wabaId');

  if (!accessToken || !wabaId) {
    return null;
  }

  return {
    accessToken,
    wabaId,
    limit: searchParams.get('limit') || undefined,
    after: searchParams.get('after') || undefined,
  };
}

interface CreateTemplateRequest {
  accessToken: string;
  wabaId: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
}

function validateCreateBody(body: unknown): body is CreateTemplateRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const {
    accessToken,
    wabaId,
    name,
    language,
    category,
    components,
  } = body as Record<string, unknown>;

  return (
    typeof accessToken === 'string' &&
    accessToken.length > 0 &&
    typeof wabaId === 'string' &&
    wabaId.length > 0 &&
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
 * List all templates for a WABA
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = validateListParams(searchParams);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameters: accessToken, wabaId. Optional: limit, after',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId, limit, after } = params;

    const limitNum = limit ? parseInt(limit, 10) : 100;
    const result = await listTemplates(wabaId, accessToken, limitNum, after);

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
          error: 'Invalid request body. Required: accessToken (string), wabaId (string), name (string), language (string), category ("MARKETING" | "UTILITY" | "AUTHENTICATION"), components (array)',
        },
        { status: 400 }
      );
    }

    const { accessToken, wabaId, name, language, category, components } = body;

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

    const result = await createTemplate(
      wabaId,
      { name, language, category, components },
      accessToken
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
