import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { getWeeklyRevenue } from '@/lib/db/dashboard-queries'
import { z } from 'zod'

const querySchema = z.object({
  weeks: z.coerce.number().min(4).max(52).default(8),
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
    const { weeks } = querySchema.parse({
      weeks: searchParams.get('weeks') || '8',
    })

    const weeksData = await getWeeklyRevenue(
      user.organizationId,
      weeks
    )

    return NextResponse.json({
      success: true,
      data: { weeks: weeksData },
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)

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
