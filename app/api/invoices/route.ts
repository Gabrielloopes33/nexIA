/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Lista todas as faturas da organização
 *     tags: [Invoices]
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
 *           enum: [pending, paid, failed]
 *         description: Status da fatura
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da assinatura
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
 *         description: Lista de faturas
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
 *                     $ref: '#/components/schemas/Invoice'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/invoices
 * List all invoices for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const subscriptionId = searchParams.get('subscriptionId');
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

    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          subscription: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          charges: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true,
            },
          },
          _count: {
            select: {
              charges: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Transforma os dados para o formato esperado pelo frontend
    const transformedInvoices = invoices.map(inv => ({
      ...inv,
      amountCents: Math.round(Number(inv.amount) * 100),
      subscription: inv.subscription ? {
        ...inv.subscription,
        plan: inv.subscription.plan ? {
          ...inv.subscription.plan,
          priceCents: Math.round(Number(inv.subscription.plan.price) * 100),
          status: inv.subscription.plan.is_active ? 'active' : 'inactive',
        } : null,
      } : null,
      charges: inv.charges ? inv.charges.map(charge => ({
        ...charge,
        amountCents: Math.round(Number(charge.amount) * 100),
      })) : [],
    }));

    return NextResponse.json({
      success: true,
      data: transformedInvoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invoices.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
