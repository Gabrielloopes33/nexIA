import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getAuthenticatedUser,
  AuthError,
  createAuthErrorResponse,
} from '@/lib/auth/helpers'

export interface OnboardingStatusResponse {
  organization: {
    id: string
    name: string
    setupComplete: boolean
  } | null
  needsOnboarding: boolean
}

/**
 * GET /api/user/onboarding-status
 * 
 * Retorna o status de onboarding do usuário atual.
 * Verifica se a organização do usuário completou o setup inicial.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser()

    // Se o usuário não tem organização, precisa fazer onboarding
    if (!user.organizationId) {
      return NextResponse.json<OnboardingStatusResponse>({
        organization: null,
        needsOnboarding: true,
      })
    }

    // Busca a organização do usuário
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        setupComplete: true,
      },
    })

    // Se a organização não existe, precisa fazer onboarding
    if (!organization) {
      return NextResponse.json<OnboardingStatusResponse>({
        organization: null,
        needsOnboarding: true,
      })
    }

    const needsOnboarding = !organization.setupComplete

    return NextResponse.json<OnboardingStatusResponse>({
      organization: {
        id: organization.id,
        name: organization.name,
        setupComplete: organization.setupComplete,
      },
      needsOnboarding,
    })
  } catch (error) {
    console.error('[API] Erro ao buscar status de onboarding:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao buscar status de onboarding' },
      { status: 500 }
    )
  }
}
