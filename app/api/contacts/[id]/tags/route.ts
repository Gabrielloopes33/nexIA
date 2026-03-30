/**
 * @swagger
 * tags:
 *   - name: Contacts
 *     description: Gerenciamento de contatos
 * 
 * /api/contacts/{id}/tags:
 *   get:
 *     summary: Lista as tags de um contato
 *     description: Retorna todas as tags associadas a um contato específico
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
 *     responses:
 *       200:
 *         description: Lista de tags do contato retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *       404:
 *         description: Contato não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   
 *   post:
 *     summary: Adiciona uma tag a um contato
 *     description: Associa uma tag existente a um contato específico
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagId
 *             properties:
 *               tagId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da tag a ser adicionada
 *               assignedBy:
 *                 type: string
 *                 description: ID do usuário que está adicionando a tag (opcional)
 *     responses:
 *       201:
 *         description: Tag adicionada ao contato com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     contactId:
 *                       type: string
 *                     tagId:
 *                       type: string
 *                     assignedAt:
 *                       type: string
 *                       format: date-time
 *                     tag:
 *                       $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Dados inválidos (tagId obrigatório)
 *       404:
 *         description: Contato ou tag não encontrada
 *       409:
 *         description: Tag já está associada a este contato
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/contacts/[id]/tags
 * List tags for a contact
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    const contactTags = await prisma.contactTag.findMany({
      where: { contactId: id },
      include: {
        tag: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: contactTags.map(ct => ct.tag),
    });
  } catch (error) {
    console.error('Error fetching contact tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact tags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/[id]/tags
 * Add a tag to a contact
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tagId, assignedBy } = body;

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: tagId' },
        { status: 400 }
      );
    }

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

    const contactTag = await prisma.contactTag.create({
      data: {
        contactId: id,
        tagId,
        assignedBy: assignedBy || null,
      },
      include: {
        tag: true,
      },
    });

    // Also update the legacy tags array on contact for compatibility
    const currentTags = contact.tags || [];
    if (!currentTags.includes(tag.name)) {
      await prisma.contact.update({
        where: { id },
        data: {
          tags: [...currentTags, tag.name],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: contactTag,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding tag to contact:', error);
    // Check for unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Tag already assigned to this contact' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add tag to contact' },
      { status: 500 }
    );
  }
}
