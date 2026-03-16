/**
 * @swagger
 * /api/segments/{id}:
 *   get:
 *     summary: Obtém um segmento específico
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do segmento
 *     responses:
 *       200:
 *         description: Segmento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Segment'
 *       404:
 *         description: Segmento não encontrado
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
 *     summary: Atualiza um segmento
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do segmento
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
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *               contactCount:
 *                 type: integer
 *               lastCalculatedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Segmento atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Segment'
 *       404:
 *         description: Segmento não encontrado
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
 *     summary: Remove um segmento
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do segmento
 *     responses:
 *       200:
 *         description: Segmento removido com sucesso
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
 *         description: Segmento não encontrado
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
 * Segment API Route
 * GET: Get a specific segment
 * PATCH: Update a segment
 * DELETE: Delete a segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/segments/[id]
 * Get a specific segment
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const segment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json(
        { success: false, error: 'Segment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: segment,
    });
  } catch (error) {
    console.error('Error fetching segment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch segment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/segments/[id]
 * Update a segment
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, rules, contactCount, lastCalculatedAt } = body;

    const existingSegment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!existingSegment) {
      return NextResponse.json(
        { success: false, error: 'Segment not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.segment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(rules !== undefined && { rules }),
        ...(contactCount !== undefined && { contactCount }),
        ...(lastCalculatedAt !== undefined && { lastCalculatedAt: new Date(lastCalculatedAt) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/segments/[id]
 * Delete a segment
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const existingSegment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!existingSegment) {
      return NextResponse.json(
        { success: false, error: 'Segment not found' },
        { status: 404 }
      );
    }

    await prisma.segment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Segment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete segment' },
      { status: 500 }
    );
  }
}
