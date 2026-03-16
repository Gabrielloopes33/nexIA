/**
 * @swagger
 * /api/custom-fields/{id}:
 *   get:
 *     summary: Obtém um campo customizado específico
 *     tags: [Custom Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do campo customizado
 *     responses:
 *       200:
 *         description: Campo customizado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFieldDefinition'
 *       404:
 *         description: Campo customizado não encontrado
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
 *     summary: Atualiza um campo customizado
 *     tags: [Custom Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do campo customizado
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
 *               type:
 *                 type: string
 *                 enum: [text, number, date, select, multiselect, boolean]
 *               required:
 *                 type: boolean
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *               displayOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Campo customizado atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFieldDefinition'
 *       404:
 *         description: Campo customizado não encontrado
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
 *     summary: Remove um campo customizado
 *     tags: [Custom Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do campo customizado
 *     responses:
 *       200:
 *         description: Campo customizado removido com sucesso
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
 *         description: Campo customizado não encontrado
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
 * Custom Field API Route
 * GET: Get a specific custom field definition
 * PATCH: Update a custom field definition
 * DELETE: Delete a custom field definition
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/custom-fields/[id]
 * Get a specific custom field definition
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const field = await prisma.customFieldDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, error: 'Custom field not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: field,
    });
  } catch (error) {
    console.error('Error fetching custom field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom field' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/custom-fields/[id]
 * Update a custom field definition
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, type, required, options, displayOrder, isActive } = body;

    const existingField = await prisma.customFieldDefinition.findUnique({
      where: { id },
    });

    if (!existingField) {
      return NextResponse.json(
        { success: false, error: 'Custom field not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(required !== undefined && { required }),
        ...(options !== undefined && { options }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating custom field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update custom field' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/custom-fields/[id]
 * Delete a custom field definition
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existingField = await prisma.customFieldDefinition.findUnique({
      where: { id },
    });

    if (!existingField) {
      return NextResponse.json(
        { success: false, error: 'Custom field not found' },
        { status: 404 }
      );
    }

    await prisma.customFieldDefinition.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete custom field' },
      { status: 500 }
    );
  }
}
