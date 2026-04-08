import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * GET /api/organization/me
 * 
 * Retorna os detalhes da organização atual do usuário autenticado.
 * Requer autenticação via cookie 'nexia_session'.
 */
export async function GET() {
  try {
    // Obtém usuário autenticado (valida JWT no cookie)
    const user = await getAuthenticatedUser()

    // Verifica se o usuário tem organização
    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    // Busca detalhes da organização e a role do membro via Prisma
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        members: {
          where: { userId: user.userId },
          select: { role: true },
          take: 1,
        },
      },
    })

    if (!org) {
      // Retorna pelo menos o id se não conseguir os detalhes
      return NextResponse.json({
        id: user.organizationId,
        name: '',
        slug: '',
        type: 'REGULAR',
        status: 'ACTIVE',
        role: null,
      })
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      status: org.status,
      role: org.members[0]?.role || null,
    })
  } catch (error) {
    console.error('[API] Erro ao buscar organização:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao carregar organização' },
      { status: 500 }
    )
  }
}
