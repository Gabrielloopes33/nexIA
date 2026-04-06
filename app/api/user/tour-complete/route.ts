import { NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'

export async function PATCH() {
  try {
    const user = await getAuthenticatedUser()
    await prisma.user.update({
      where: { id: user.userId },
      data: { onboardingTourCompleted: true },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
