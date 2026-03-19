import { NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
