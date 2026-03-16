/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Obtém uma lista específica
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     responses:
 *       200:
 *         description: Lista encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/List'
 *       404:
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Atualiza uma lista
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               filters:
 *                 type: object
 *               isDynamic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lista atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/List'
 *       404:
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Remove uma lista
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *     responses:
 *       200:
 *         description: Lista removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Lista não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * List API Route
 * GET: Get a specific list
 * PATCH: Update a list
 * DELETE: Delete a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/lists/[id]
 * Get a specific list
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        listContacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
          take: 50,
        },
        _count: {
          select: {
            listContacts: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lists/[id]
 * Update a list
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, filters, isDynamic } = body;

    const existingList = await prisma.list.findUnique({
      where: { id },
    });

    if (!existingList) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.list.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(filters !== undefined && { filters }),
        ...(isDynamic !== undefined && { isDynamic }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update list' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lists/[id]
 * Delete a list
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existingList = await prisma.list.findUnique({
      where: { id },
    });

    if (!existingList) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    await prisma.list.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}
