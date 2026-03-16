/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Obtém uma assinatura específica
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da assinatura
 *     responses:
 *       200:
 *         description: Assinatura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Assinatura não encontrada
 *       500:
 *         description: Erro interno
 *   patch:
 *     summary: Atualiza uma assinatura (cancelar, mudar plano)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, canceled, past_due]
 *               currentPeriodStart:
 *                 type: string
 *                 format: date-time
 *               currentPeriodEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Assinatura atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Assinatura não encontrada
 *       500:
 *         description: Erro interno
 *   delete:
 *     summary: Cancela uma assinatura
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Assinatura cancelada com sucesso
 *       404:
 *         description: Assinatura não encontrada
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/subscriptions/[id]
 * Get a specific subscription
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions/[id]
 * Update a subscription
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      planId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
    } = body;

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
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

    // Check if plan exists if changing plan
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        );
      }
    }

    // Validate dates if provided
    let periodStart: Date | undefined;
    let periodEnd: Date | undefined;

    if (currentPeriodStart) {
      periodStart = new Date(currentPeriodStart);
      if (isNaN(periodStart.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format for currentPeriodStart' },
          { status: 400 }
        );
      }
    }

    if (currentPeriodEnd) {
      periodEnd = new Date(currentPeriodEnd);
      if (isNaN(periodEnd.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format for currentPeriodEnd' },
          { status: 400 }
        );
      }
    }

    // Use existing dates if not provided
    const finalStartDate = periodStart || existingSubscription.currentPeriodStart;
    const finalEndDate = periodEnd || existingSubscription.currentPeriodEnd;

    if (finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { success: false, error: 'currentPeriodEnd must be after currentPeriodStart' },
        { status: 400 }
      );
    }

    // Handle canceledAt when status changes to canceled
    let canceledAt = existingSubscription.canceledAt;
    if (status === 'canceled' && existingSubscription.status !== 'canceled') {
      canceledAt = new Date();
    } else if (status === 'active' && existingSubscription.status === 'canceled') {
      canceledAt = null;
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        planId: planId || undefined,
        status: status || undefined,
        currentPeriodStart: periodStart || undefined,
        currentPeriodEnd: periodEnd || undefined,
        canceledAt,
      },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Cancel a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Soft cancel - update status instead of deleting
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
