import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { createSession } from '@/lib/auth/session'

export async function POST() {
  try {
    const user = await getAuthenticatedUser()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { organization: true },
          take: 1,
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const activeMembership = dbUser.memberships[0]
    const organizationId = activeMembership?.organizationId ?? null

    await createSession({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      organizationId,
    })

    return NextResponse.json({
      success: true,
      message: 'Sessão atualizada',
      organizationId,
      organizationName: activeMembership?.organization?.name ?? null,
    })
  } catch (error) {
    console.error('[API] Erro:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
