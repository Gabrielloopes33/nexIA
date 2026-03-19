import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { getLostReasonsStats } from '@/lib/db/dashboard-queries'
import { z } from 'zod'

const querySchema = z.object({
  period: z.enum(['today', '7d', '30d', '90d']).default('30d'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { period } = querySchema.parse({
      period: searchParams.get('period') || '30d',
    })

    const reasons = await getLostReasonsStats(
      user.organizationId,
      period
    )

    return NextResponse.json({
      success: true,
      data: { reasons },
    })
  } catch (error) {
    console.error('Error fetching lost reasons:', error)

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
