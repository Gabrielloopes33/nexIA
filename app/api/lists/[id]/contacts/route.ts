/**
 * @swagger
 * /api/lists/{id}/contacts:
 *   get:
 *     summary: Lista todos os contatos de uma lista
 *     tags: [Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da lista
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de contatos
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
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
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
 *   post:
 *     summary: Adiciona um contato à lista
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
 *             required:
 *               - contactId
 *             properties:
 *               contactId:
 *                 type: string
 *                 format: uuid
 *               addedBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Contato adicionado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Lista ou contato não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Contato já está na lista
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
 * List Contacts API Route
 * POST: Add a contact to a list
 * GET: List all contacts in a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/lists/[id]/contacts
 * Get all contacts in a list
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const list = await prisma.list.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    const [listContacts, total] = await Promise.all([
      prisma.listContact.findMany({
        where: { listId: id },
        orderBy: { addedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          contact: {
            include: {
              _count: {
                select: {
                  conversations: true,
                  deals: true,
                },
              },
            },
          },
        },
      }),
      prisma.listContact.count({ where: { listId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: listContacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + listContacts.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching list contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch list contacts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lists/[id]/contacts
 * Add a contact to a list
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contactId, addedBy } = body;

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const list = await prisma.list.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if contact is already in the list
    const existingEntry = await prisma.listContact.findUnique({
      where: {
        listId_contactId: {
          listId: id,
          contactId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Contact is already in this list' },
        { status: 409 }
      );
    }

    const listContact = await prisma.listContact.create({
      data: {
        listId: id,
        contactId,
        addedBy: addedBy || null,
      },
      include: {
        contact: true,
      },
    });

    // Update contact count
    await prisma.list.update({
      where: { id },
      data: {
        contactCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: listContact,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding contact to list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add contact to list' },
      { status: 500 }
    );
  }
}
