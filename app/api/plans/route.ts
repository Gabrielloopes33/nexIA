/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Lista todos os planos ativos
 *     tags: [Plans]
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [monthly, yearly]
 *         description: Filtrar por intervalo de cobrança
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
 *         description: Lista de planos
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
 *                     $ref: '#/components/schemas/Plan'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Cria um novo plano (admin only)
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - priceCents
 *               - interval
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priceCents:
 *                 type: integer
 *                 description: Preço em centavos
 *               interval:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               features:
 *                 type: object
 *               limits:
 *                 type: object
 *     responses:
 *       201:
 *         description: Plano criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/plans
 * List all active plans (global - no org filter needed)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {
      is_active: true,
    };

    if (interval) {
      where.interval = interval;
    }

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: { price: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.plan.count({ where }),
    ]);

    // Transforma os dados para o formato esperado pelo frontend
    const transformedPlans = plans.map(plan => ({
      ...plan,
      priceCents: Math.round(Number(plan.price) * 100),
      status: plan.is_active ? 'active' : 'inactive',
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlans,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + plans.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plans
 * Create a new plan (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      name,
      description,
      priceCents,
      interval,
      features,
      limits,
    } = body;

    // Validate required fields
    if (!name || priceCents === undefined || !interval) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, priceCents, interval' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interval. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof priceCents !== 'number' || priceCents < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid priceCents. Must be a positive number' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: priceCents / 100, // Converte centavos para decimal
        interval,
        features: features || {},
      },
    });

    // Transforma o resultado para o formato esperado pelo frontend
    const transformedPlan = {
      ...plan,
      priceCents: Math.round(Number(plan.price) * 100),
      status: plan.is_active ? 'active' : 'inactive',
    };

    return NextResponse.json({
      success: true,
      data: transformedPlan,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
