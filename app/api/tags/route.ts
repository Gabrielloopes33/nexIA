/**
 * Tags API Route (Refatorado - Fase 3: RBAC)
 * GET: List all tags for the authenticated user's organization
 * POST: Create a new tag (MANAGER+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { 
  withPermission
} from '@/lib/auth/permissions';

/**
 * GET /api/tags
 * List all tags for the authenticated user's organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { 
      organizationId,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              contactTags: true,
            },
          },
        },
      }),
      prisma.tag.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tags,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tags.length < total,
      },
    });
  } catch (error) {
    console.error('[Tags GET] Error:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags
 * Create a new tag (requer permissão tags:manage - MANAGER+)
 */
export const POST = withPermission(
  'tags:manage',
  async (request: NextRequest, member) => {
    try {
      const body = await request.json();
      const { 
        name, 
        color,
        description,
        source,
      } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: name' },
          { status: 400 }
        );
      }

      // Check if tag already exists for this organization
      const existingTag = await prisma.tag.findUnique({
        where: {
          organizationId_name: {
            organizationId: member.organizationId,
            name: name.trim(),
          },
        },
      });

      if (existingTag) {
        return NextResponse.json(
          { success: false, error: 'Tag with this name already exists' },
          { status: 409 }
        );
      }

      const tag = await prisma.tag.create({
        data: {
          organizationId: member.organizationId,
          name: name.trim(),
          color: color || '#6366f1',
          description: description || null,
          source: source || 'manual',
        },
      });

      return NextResponse.json({
        success: true,
        data: tag,
      }, { status: 201 });
    } catch (error) {
      console.error('[Tags POST] Error:', error);

      return NextResponse.json(
        { success: false, error: 'Failed to create tag' },
        { status: 500 }
      );
    }
  }
);
