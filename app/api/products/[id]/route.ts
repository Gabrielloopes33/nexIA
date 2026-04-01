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
 * GET /api/products/[id]
 * Obtém um produto específico com seus pipelines
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const organizationId = await getOrganizationId();
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        pipelines: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('[Product GET] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Atualiza um produto
 */
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, status } = body;

    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Nome não pode ser vazio' },
          { status: 400 }
        );
      }
      const duplicate = await prisma.product.findFirst({
        where: {
          organizationId,
          name: name.trim(),
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Já existe um produto com este nome' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Product PATCH] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Remove um produto
 */
export async function DELETE(
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

    const { id } = await params;

    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso',
    });
  } catch (error) {
    console.error('[Product DELETE] Error:', error);
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    const isFkError =
      (error instanceof Error && error.message.includes('foreign key constraint')) ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        ['P2003', 'P2014'].includes((error as { code: string }).code));
    if (isFkError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não é possível excluir produto com deals associados',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
