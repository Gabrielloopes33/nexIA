/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Obtém uma tag específica
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tag
 *     responses:
 *       200:
 *         description: Tag encontrada
 *       404:
 *         description: Tag não encontrada
 *   patch:
 *     summary: Atualiza uma tag (MANAGER+)
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tag atualizada
 *       403:
 *         description: Sem permissão
 *   delete:
 *     summary: Remove uma tag (ADMIN+)
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tag removida
 *       403:
 *         description: Sem permissão
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getOrganizationId, 
  AuthError, 
  createAuthErrorResponse 
} from '@/lib/auth/helpers';
import { 
  withPermission,
  permissionDeniedResponse
} from '@/lib/auth/permissions';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tags/[id]
 * Get a specific tag
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        contactTags: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            contactTags: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Verifica se a tag pertence à organização
    if (tag.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tags/[id]
 * Update a tag (requer permissão tags:manage - MANAGER+)
 */
export const PATCH = withPermission(
  'tags:manage',
  async (request: NextRequest, member, { params }: RouteParams) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { name, color, description, source } = body;

      const existingTag = await prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        return NextResponse.json(
          { success: false, error: 'Tag not found' },
          { status: 404 }
        );
      }

      // Verifica se a tag pertence à organização
      if (existingTag.organizationId !== member.organizationId) {
        return permissionDeniedResponse('Acesso negado a esta tag');
      }

      // Check if name is being changed and if new name already exists
      if (name && name !== existingTag.name) {
        const nameExists = await prisma.tag.findUnique({
          where: {
            organizationId_name: {
              organizationId: member.organizationId,
              name: name.trim(),
            },
          },
        });

        if (nameExists) {
          return NextResponse.json(
            { success: false, error: 'Tag with this name already exists' },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.tag.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(color !== undefined && { color }),
          ...(description !== undefined && { description }),
          ...(source !== undefined && { source }),
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to update tag' },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/tags/[id]
 * Delete a tag (requer permissão tags:manage - ADMIN+)
 * 
 * Nota: MANAGER pode editar, mas apenas ADMIN+ pode excluir
 */
export const DELETE = withPermission(
  'tags:manage',
  async (request: NextRequest, member, { params }: RouteParams) => {
    try {
      const { id } = await params;

      const existingTag = await prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        return NextResponse.json(
          { success: false, error: 'Tag not found' },
          { status: 404 }
        );
      }

      // Verifica se a tag pertence à organização
      if (existingTag.organizationId !== member.organizationId) {
        return permissionDeniedResponse('Acesso negado a esta tag');
      }

      await prisma.tag.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Tag deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      
      return NextResponse.json(
        { success: false, error: 'Failed to delete tag' },
        { status: 500 }
      );
    }
  }
);
