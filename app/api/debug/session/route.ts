import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      }
    })
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: 'Não autenticado'
    }, { status: 401 })
  }
}
