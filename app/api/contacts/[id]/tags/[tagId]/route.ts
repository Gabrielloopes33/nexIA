/**
 * @swagger
 * tags:
 *   - name: Contacts
 *     description: Gerenciamento de contatos
 * 
 * /api/contacts/{id}/tags/{tagId}:
 *   delete:
 *     summary: Remove uma tag de um contato
 *     description: Desassocia uma tag específica de um contato
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do contato
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tag a ser removida
 *     responses:
 *       200:
 *         description: Tag removida do contato com sucesso
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
 *         description: Contato, tag ou associação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
    tagId: string;
  }>;
}

/**
 * DELETE /api/contacts/[id]/tags/[tagId]
 * Remove a tag from a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id, tagId } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    const existingRelation = await prisma.contactTag.findUnique({
      where: {
        contactId_tagId: {
          contactId: id,
          tagId,
        },
      },
    });

    if (!existingRelation) {
      return NextResponse.json(
        { success: false, error: 'Tag is not assigned to this contact' },
        { status: 404 }
      );
    }

    await prisma.contactTag.delete({
      where: {
        contactId_tagId: {
          contactId: id,
          tagId,
        },
      },
    });

    // Also update the legacy tags array on contact for compatibility
    const currentTags = contact.tags || [];
    const updatedTags = currentTags.filter(t => t !== tag.name);
    if (updatedTags.length !== currentTags.length) {
      await prisma.contact.update({
        where: { id },
        data: {
          tags: updatedTags,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tag removed from contact successfully',
    });
  } catch (error) {
    console.error('Error removing tag from contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove tag from contact' },
      { status: 500 }
    );
  }
}
