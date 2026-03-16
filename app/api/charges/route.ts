/**
 * @swagger
 * /api/charges:
 *   get:
 *     summary: Lista todas as cobranças da organização
 *     tags: [Charges]
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
 *         description: Status da cobrança
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da fatura
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
 *         description: Lista de cobranças
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
 *                     $ref: '#/components/schemas/Charge'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Cria uma nova cobrança
 *     tags: [Charges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - amountCents
 *             properties:
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amountCents:
 *                 type: integer
 *                 description: Valor em centavos
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *                 default: pending
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cobrança criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Fatura não encontrada
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/charges
 * List all charges for an organization
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');
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

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    const [charges, total] = await Promise.all([
      prisma.charge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          invoice: {
            select: {
              id: true,
              amountCents: true,
              status: true,
              dueDate: true,
            },
          },
        },
      }),
      prisma.charge.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: charges,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + charges.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching charges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch charges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/charges
 * Create a new charge
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      organizationId,
      invoiceId,
      amountCents,
      description,
      status,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!organizationId || amountCents === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: organizationId, amountCents' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amountCents. Must be a positive number' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['pending', 'paid', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if invoice exists if provided
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Verify invoice belongs to the same organization
      if (invoice.organizationId !== organizationId) {
        return NextResponse.json(
          { success: false, error: 'Invoice does not belong to this organization' },
          { status: 400 }
        );
      }
    }

    // Calculate paidAt if status is paid
    const paidAt = status === 'paid' ? new Date() : null;

    const charge = await prisma.charge.create({
      data: {
        organizationId,
        invoiceId: invoiceId || null,
        amountCents,
        description: description?.trim() || null,
        status: status || 'pending',
        paymentMethod: paymentMethod?.trim() || null,
        paidAt,
      },
      include: {
        invoice: {
          select: {
            id: true,
            amountCents: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: charge,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating charge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create charge' },
      { status: 500 }
    );
  }
}
