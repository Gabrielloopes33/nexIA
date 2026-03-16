/**
 * @swagger
 * /api/custom-fields:
 *   get:
 *     summary: Lista todos os campos customizados da organização
 *     tags: [Custom Fields]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar apenas campos ativos
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
 *         description: Lista de campos customizados
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
 *                     $ref: '#/components/schemas/CustomFieldDefinition'
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
 *     summary: Cria um novo campo customizado
 *     tags: [Custom Fields]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - name
 *               - key
 *               - type
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               key:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, number, date, select, multiselect, boolean]
 *               required:
 *                 type: boolean
 *                 default: false
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *               displayOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Campo customizado criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CustomFieldDefinition'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Chave já existe
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
 * Custom Fields API Route
 * GET: List all custom field definitions for an organization
 * POST: Create a new custom field definition
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/custom-fields
 * List all custom field definitions for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const isActive = searchParams.get('isActive');
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

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [fields, total] = await Promise.all([
      prisma.customFieldDefinition.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.customFieldDefinition.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: fields,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + fields.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch custom fields' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/custom-fields
 * Create a new custom field definition
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      organizationId, 
      name, 
      key,
      description,
      type,
      required,
      options,
      displayOrder,
      isActive,
    } = body;

    // Validate required fields
    if (!organizationId || !name || !key || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, name, key, type' },
        { status: 400 }
      );
    }

    // Validate key format (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return NextResponse.json(
        { success: false, error: 'Key must contain only letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    // Check if key already exists for this organization
    const existingField = await prisma.customFieldDefinition.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: key.toLowerCase(),
        },
      },
    });

    if (existingField) {
      return NextResponse.json(
        { success: false, error: 'Custom field with this key already exists' },
        { status: 409 }
      );
    }

    const field = await prisma.customFieldDefinition.create({
      data: {
        organizationId,
        name: name.trim(),
        key: key.toLowerCase(),
        description: description || null,
        type,
        required: required || false,
        options: options || [],
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      success: true,
      data: field,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating custom field:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}
