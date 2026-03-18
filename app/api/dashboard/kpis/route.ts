import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getKPIs } from '@/lib/db/dashboard-queries'
import { z } from 'zod'
import { cookies } from 'next/headers'

const querySchema = z.object({
  period: z.enum(['today', '7d', '30d', '90d']).default('30d'),
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
    const { period } = querySchema.parse({
      period: searchParams.get('period') || '30d',
    })

    const raw = await getKPIs(userData.organization_id, period)

    // Transforma estrutura aninhada { leads: { value, change } }
    // para estrutura plana esperada pelo frontend (KPIs interface)
    const data = {
      leadsThisWeek: raw.leads.value,
      leadsGrowth: raw.leads.change,
      closedRevenue: raw.revenue.value,
      revenueGrowth: raw.revenue.change,
      conversionRate: raw.conversionRate.value,
      conversionChange: raw.conversionRate.change,
      pipelineValue: raw.pipelineValue.value,
      pipelineChange: raw.pipelineValue.change,
      avgDealTime: raw.avgDealTime.value,
      avgDealTimeChange: raw.avgDealTime.change,
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    
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
