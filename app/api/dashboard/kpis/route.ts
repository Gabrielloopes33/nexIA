import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { getKPIs } from '@/lib/db/dashboard-queries'
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

    const raw = await getKPIs(user.organizationId, period)

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
