/**
 * @swagger
 * tags:
 *   - name: Contacts
 *     description: Gerenciamento de contatos
 *
 * /api/contacts/by-phone/tags:
 *   post:
 *     summary: Adiciona uma tag a um contato pelo telefone
 *     description: Busca o contato pelo telefone e adiciona uma tag existente a ele
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - tagId
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Telefone do contato (com ou sem formatação)
 *                 example: "+55 11 99999-9999"
 *               tagId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da tag a ser adicionada
 *               assignedBy:
 *                 type: string
 *                 description: ID do usuário que está adicionando a tag (opcional)
 *               createIfNotExists:
 *                 type: boolean
 *                 default: false
 *                 description: Se true, cria o contato caso não exista
 *               contactName:
 *                 type: string
 *                 description: Nome do contato (usado apenas se createIfNotExists for true)
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
 *                     contact:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *       400:
 *         description: Dados inválidos (telefone e tagId obrigatórios)
 *       404:
 *         description: Contato ou tag não encontrada
 *       409:
 *         description: Tag já está associada a este contato
 *       500:
 *         description: Erro interno do servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOrganizationId,
  AuthError,
  createAuthErrorResponse,
} from '@/lib/auth/helpers';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';

/**
 * OPTIONS /api/contacts/by-phone/tags
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return handleCorsPreflight();
}

/**
 * POST /api/contacts/by-phone/tags
 * Add a tag to a contact by phone number
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const body = await request.json();
    const { phone, tagId, assignedBy, createIfNotExists = false, contactName } = body;

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: phone' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: tagId' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Find contact by phone and organization
    let contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone: normalizedPhone,
        deletedAt: null,
      },
    });

    // Create contact if not exists and createIfNotExists is true
    if (!contact && createIfNotExists) {
      contact = await prisma.contact.create({
        data: {
          organizationId,
          phone: normalizedPhone,
          name: contactName || null,
          status: 'ACTIVE',
          leadScore: 0,
          tags: [],
          lastInteractionAt: new Date(),
        },
      });
    }

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found with this phone number' },
        { status: 404 }
      );
    }

    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check if tag belongs to the same organization
    if (tag.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Tag does not belong to this organization' },
        { status: 403 }
      );
    }

    // Create the association
    const contactTag = await prisma.contactTag.create({
      data: {
        contactId: contact.id,
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
        where: { id: contact.id },
        data: {
          tags: [...currentTags, tag.name],
        },
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        data: {
          ...contactTag,
          contact: {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
          },
        },
      },
      { status: 201 }
    );
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error adding tag to contact by phone:', error);

    if (error instanceof AuthError) {
      return addCorsHeaders(createAuthErrorResponse(error));
    }

    // Check for unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      const response = NextResponse.json(
        { success: false, error: 'Tag already assigned to this contact' },
        { status: 409 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json(
      { success: false, error: 'Failed to add tag to contact' },
      { status: 500 }
    );
    
    return addCorsHeaders(response);
  }
}
