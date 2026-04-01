import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOrganizationId,
  requireOrganizationMembership,
  AuthError,
  createAuthErrorResponse,
} from '@/lib/auth/helpers';

/**
 * GET /api/products
 * Lista todos os produtos da organização
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { pipelines: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    });
  } catch (error) {
    console.error('[Products GET] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Cria um novo produto
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const auth = await requireOrganizationMembership(organizationId);

    if (!['OWNER', 'ADMIN'].includes(auth.membership.role)) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color, status } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: name.trim(),
        description: description || null,
        color: color || '#6366f1',
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Products POST] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: 'Já existe um produto com este nome' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
