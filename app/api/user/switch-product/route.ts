import { NextRequest, NextResponse } from 'next/server'
import { getOrganizationId, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { updateSessionProduct } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/user/switch-product
 * Altera o productId ativo na sessão do usuário.
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId é obrigatório' },
        { status: 400 }
      )
    }

    // Valida que o produto pertence à organização
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    await updateSessionProduct(productId)

    return NextResponse.json({
      success: true,
      data: { productId },
    })
  } catch (error) {
    console.error('[Switch Product] Error:', error)
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }
    return NextResponse.json(
      { success: false, error: 'Failed to switch product' },
      { status: 500 }
    )
  }
}
