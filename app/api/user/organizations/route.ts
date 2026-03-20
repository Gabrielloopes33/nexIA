import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * GET /api/user/organizations
 * 
 * Lista todas as organizações do usuário autenticado
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    const memberships = await prisma.organizationMember.findMany({
      where: { 
        userId: user.userId,
        status: 'ACTIVE'
      },
      include: { 
        organization: true 
      },
      orderBy: { 
        joinedAt: 'asc' 
      },
    })

    const organizations = memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      status: m.organization.status,
      role: m.role,
      joinedAt: m.joinedAt,
      isCurrent: m.organization.id === user.organizationId,
    }))

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('[API] Erro ao listar organizações:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao listar organizações' },
      { status: 500 }
    )
  }
}
