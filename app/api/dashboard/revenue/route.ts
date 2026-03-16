import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getWeeklyRevenue } from '@/lib/db/dashboard-queries'
import { z } from 'zod'
import { cookies } from 'next/headers'

const querySchema = z.object({
  weeks: z.coerce.number().min(4).max(52).default(8),
})

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
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
      userData.organization_id,
      weeks
    )

    return NextResponse.json({
      success: true,
      data: { weeks: weeksData },
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    
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
