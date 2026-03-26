/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Lista todas as assinaturas da organização
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da organização
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, canceled, past_due]
 *         description: Status da assinatura
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
 *         description: Lista de assinaturas
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
 *                     $ref: '#/components/schemas/Subscription'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Cria uma nova assinatura para a organização
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - planId
 *               - currentPeriodStart
 *               - currentPeriodEnd
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               planId:
 *                 type: string
 *                 format: uuid
 *               currentPeriodStart:
 *                 type: string
 *                 format: date-time
 *               currentPeriodEnd:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [active, canceled, past_due]
 *                 default: active
 *     responses:
 *       201:
 *         description: Assinatura criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/subscriptions
 * List all subscriptions for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
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

    if (status) {
      where.status = status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          plan: true,
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    // Transforma os dados para o formato esperado pelo frontend
    const transformedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      plan: sub.plan ? {
        ...sub.plan,
        priceCents: Math.round(Number(sub.plan.price) * 100),
        status: sub.plan.is_active ? 'active' : 'inactive',
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSubscriptions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + subscriptions.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription for an organization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      organizationId,
      planId,
      currentPeriodStart,
      currentPeriodEnd,
      status,
    } = body;

    // Validate required fields
    if (!organizationId || !planId || !currentPeriodStart || !currentPeriodEnd) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, planId, currentPeriodStart, currentPeriodEnd' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Validate dates
    const periodStart = new Date(currentPeriodStart);
    const periodEnd = new Date(currentPeriodEnd);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format for currentPeriodStart or currentPeriodEnd' },
        { status: 400 }
      );
    }

    if (periodEnd <= periodStart) {
      return NextResponse.json(
        { success: false, error: 'currentPeriodEnd must be after currentPeriodStart' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['active', 'canceled', 'past_due'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        status: status || 'active',
      },
      include: {
        plan: true,
      },
    });

    // Transforma o resultado para o formato esperado pelo frontend
    const transformedSubscription = {
      ...subscription,
      plan: subscription.plan ? {
        ...subscription.plan,
        priceCents: Math.round(Number(subscription.plan.price) * 100),
        status: subscription.plan.is_active ? 'active' : 'inactive',
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: transformedSubscription,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
