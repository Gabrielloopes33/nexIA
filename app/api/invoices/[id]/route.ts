/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Obtém uma fatura específica com items
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da fatura
 *     responses:
 *       200:
 *         description: Fatura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       404:
 *         description: Fatura não encontrada
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/invoices/[id]
 * Get a specific invoice with items (charges)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                description: true,
                priceCents: true,
                interval: true,
              },
            },
          },
        },
        charges: {
          orderBy: { createdAt: 'desc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalPaid = invoice.charges
      .filter(charge => charge.status === 'paid')
      .reduce((sum, charge) => sum + charge.amountCents, 0);

    const totalPending = invoice.charges
      .filter(charge => charge.status === 'pending')
      .reduce((sum, charge) => sum + charge.amountCents, 0);

    const totalFailed = invoice.charges
      .filter(charge => charge.status === 'failed')
      .reduce((sum, charge) => sum + charge.amountCents, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        summary: {
          totalAmount: invoice.amountCents,
          totalPaid,
          totalPending,
          totalFailed,
          remainingAmount: Math.max(0, invoice.amountCents - totalPaid),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}
