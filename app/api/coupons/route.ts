/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Lista todos os cupons ativos
 *     tags: [Coupons]
 *     parameters:
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
 *         description: Lista de cupons
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
 *                     $ref: '#/components/schemas/Coupon'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         description: Erro interno
 *   post:
 *     summary: Valida um cupom (recebe code, retorna dados do cupom se válido)
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código do cupom
 *     responses:
 *       200:
 *         description: Cupom válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *                 message:
 *                   type: string
 *       400:
 *         description: Código não fornecido
 *       404:
 *         description: Cupom inválido ou expirado
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/coupons
 * List all active coupons
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const now = new Date();

    const where: Record<string, unknown> = {
      status: 'active',
      validFrom: {
        lte: now,
      },
      validUntil: {
        gte: now,
      },
    };

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: coupons,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + coupons.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons
 * Validate a coupon code
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { code } = body;

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Find coupon by code
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    // Check if coupon exists
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (coupon.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Coupon is inactive' },
        { status: 404 }
      );
    }

    // Check validity period
    if (coupon.validFrom > now) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not yet valid' },
        { status: 404 }
      );
    }

    if (coupon.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired' },
        { status: 404 }
      );
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Coupon usage limit reached' },
        { status: 404 }
      );
    }

    // Calculate discount info
    const discountInfo = {
      type: coupon.discountPercent ? 'percentage' : 'fixed',
      value: coupon.discountPercent || coupon.discountCents || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...coupon,
        discountInfo,
        remainingUses: coupon.maxUses !== null ? coupon.maxUses - coupon.usesCount : null,
      },
      message: 'Coupon is valid',
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
