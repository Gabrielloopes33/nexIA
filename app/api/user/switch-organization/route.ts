import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { createSession } from '@/lib/auth/session'

/**
 * POST /api/user/switch-organization
 * 
 * Troca a organização ativa do usuário
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'ID da organização é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se usuário é membro da organização
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.userId,
        organizationId,
        status: 'ACTIVE',
      },
      include: { organization: true }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Você não tem acesso a esta organização' },
        { status: 403 }
      )
    }

    // Atualiza sessão com nova organização
    const org = membership.organization!
    await createSession({
      userId: user.userId,
      email: user.email,
      name: user.name,
      organizationId: org.id,
      productId: null,
      setupComplete: org.setupComplete ?? false,
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      }
    })
  } catch (error) {
    console.error('[API] Erro ao trocar organização:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao trocar organização' },
      { status: 500 }
    )
  }
}
