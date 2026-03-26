import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * GET /api/user/current-organization
 * 
 * Retorna a organização atual do usuário baseado na sessão.
 * Usado no onboarding para garantir que estamos usando a organização correta.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    // Busca a organização da sessão
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        setupComplete: true,
        logoUrl: true,
        segment: true,
      },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Busca a role do usuário na organização
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: org.id,
        userId: user.userId,
        status: 'ACTIVE',
      },
      select: {
        role: true,
      },
    })

    return NextResponse.json({
      ...org,
      role: membership?.role || null,
    })
  } catch (error) {
    console.error('[API] Erro ao buscar organização atual:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao buscar organização' },
      { status: 500 }
    )
  }
}
