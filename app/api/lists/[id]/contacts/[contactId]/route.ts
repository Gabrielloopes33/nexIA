/**
 * @swagger
 * /api/lists/{id}/contacts/{contactId}:
 *   delete:
 *     summary: Remove um contato da lista
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Contato removido com sucesso
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
 *         description: Lista ou contato não encontrado
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
 * List Contact API Route
 * DELETE: Remove a contact from a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
    contactId: string;
  }>;
}

/**
 * DELETE /api/lists/[id]/contacts/[contactId]
 * Remove a contact from a list
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id, contactId } = await params;

    const list = await prisma.list.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    const existingEntry = await prisma.listContact.findUnique({
      where: {
        listId_contactId: {
          listId: id,
          contactId,
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Contact is not in this list' },
        { status: 404 }
      );
    }

    await prisma.listContact.delete({
      where: {
        listId_contactId: {
          listId: id,
          contactId,
        },
      },
    });

    // Update contact count
    await prisma.list.update({
      where: { id },
      data: {
        contactCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact removed from list successfully',
    });
  } catch (error) {
    console.error('Error removing contact from list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove contact from list' },
      { status: 500 }
    );
  }
}
