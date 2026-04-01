import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getOrganizationId,
  requireOrganizationMembership,
  AuthError,
  createAuthErrorResponse,
} from '@/lib/auth/helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/products/[id]/pipelines
 * Lista todos os pipelines de um produto
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id: productId } = await params;

    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { productId, organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { stages: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: pipelines });
  } catch (error) {
    console.error('[Product Pipelines GET] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/pipelines
 * Cria um novo pipeline para um produto
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const auth = await requireOrganizationMembership(organizationId);

    if (!['OWNER', 'ADMIN'].includes(auth.membership.role)) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { name, isDefault } = body;

    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    let pipeline;
    if (isDefault) {
      pipeline = await prisma.$transaction(async (tx) => {
        await tx.pipeline.updateMany({
          where: { productId, isDefault: true },
          data: { isDefault: false },
        });
        return tx.pipeline.create({
          data: {
            productId,
            organizationId,
            name: name.trim(),
            isDefault: true,
          },
        });
      });
    } else {
      pipeline = await prisma.pipeline.create({
        data: {
          productId,
          organizationId,
          name: name.trim(),
        },
      });
    }

    return NextResponse.json(
      { success: true, data: pipeline },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Product Pipelines POST] Error:', error);
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
        {
          success: false,
          error: 'Já existe um pipeline com este nome para este produto',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
