/**
 * @swagger
 * /api/segments:
 *   get:
 *     summary: Lista todos os segmentos da organização
 *     tags: [Segments]
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
 *         description: Lista de segmentos
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
 *                     $ref: '#/components/schemas/Segment'
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
 *     summary: Cria um novo segmento
 *     tags: [Segments]
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
 *               rules:
 *                 type: array
 *                 items:
 *                   type: object
 *               createdBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Segmento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Segment'
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
 * Segments API Route
 * GET: List all segments for an organization
 * POST: Create a new segment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/segments
 * List all segments for an organization
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

    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.segment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: segments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + segments.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/segments
 * Create a new segment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      name, 
      description,
      rules,
      createdBy,
    } = body;

    // Validate required fields
    if (!organizationId || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, name' },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.create({
      data: {
        organizationId,
        name: name.trim(),
        description: description || null,
        rules: rules || [],
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: segment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create segment' },
      { status: 500 }
    );
  }
}
