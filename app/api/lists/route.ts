/**
 * @swagger
 * /api/lists:
 *   get:
 *     summary: Lista todas as listas da organização
 *     tags: [Lists]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
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
 *         description: Lista de listas
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
 *                     $ref: '#/components/schemas/List'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
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
 *     summary: Cria uma nova lista
 *     tags: [Lists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - name
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               filters:
 *                 type: object
 *               isDynamic:
 *                 type: boolean
 *                 default: false
 *               createdBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Lista criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/List'
 *       400:
 *         description: Dados inválidos
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
 * Lists API Route
 * GET: List all lists for an organization
 * POST: Create a new list
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lists
 * List all lists for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { 
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [lists, total] = await Promise.all([
      prisma.list.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              listContacts: true,
            },
          },
        },
      }),
      prisma.list.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: lists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + lists.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lists
 * Create a new list
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      name, 
      description,
      filters,
      isDynamic,
      createdBy,
    } = body;

    // Validate required fields
    if (!organizationId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, name' },
        { status: 400 }
      );
    }

    const list = await prisma.list.create({
      data: {
        organizationId,
        name: name.trim(),
        description: description || null,
        filters: filters || {},
        isDynamic: isDynamic || false,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: list,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create list' },
      { status: 500 }
    );
  }
}
