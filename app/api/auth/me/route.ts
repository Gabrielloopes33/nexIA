import { NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    // Try to fetch onboardingTourCompleted, fallback to false if column doesn't exist
    let onboardingTourCompleted = false
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { onboardingTourCompleted: true },
      })
      onboardingTourCompleted = dbUser?.onboardingTourCompleted ?? false
    } catch (prismaError) {
      // Column doesn't exist yet, use default false
      console.warn('[API /auth/me] onboardingTourCompleted column not found, using default')
      onboardingTourCompleted = false
    }
    
    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      setupComplete: user.setupComplete,
      onboardingTourCompleted,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
