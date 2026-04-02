import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { getKPIs } from '@/lib/db/dashboard-queries'
import { KpisData } from '@/types/dashboard'
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

    // Transforma estrutura aninhada no formato KpisData esperado pelo frontend
    const data: KpisData = {
      kpis: [
        {
          id: 'weekly-leads',
          label: 'Leads Semana',
          value: raw.leads.value,
          previousValue: Math.round(raw.leads.value / (1 + raw.leads.change / 100)),
          change: Math.abs(raw.leads.change),
          changeType: raw.leads.change >= 0 ? 'positive' : 'negative',
          format: 'number',
          trend: raw.leads.change >= 0 ? 'up' : 'down',
        },
        {
          id: 'closed-revenue',
          label: 'Receita Fechada',
          value: raw.revenue.value,
          previousValue: Math.round(raw.revenue.value / (1 + raw.revenue.change / 100)),
          change: Math.abs(raw.revenue.change),
          changeType: raw.revenue.change >= 0 ? 'positive' : 'negative',
          format: 'currency',
          trend: raw.revenue.change >= 0 ? 'up' : 'down',
        },
        {
          id: 'conversion-rate',
          label: 'Taxa Conversão',
          value: Math.round(raw.conversionRate.value * 10) / 10,
          previousValue: Math.round((raw.conversionRate.value / (1 + raw.conversionRate.change / 100)) * 10) / 10,
          change: Math.abs(raw.conversionRate.change),
          changeType: raw.conversionRate.change >= 0 ? 'positive' : 'negative',
          format: 'percentage',
          trend: raw.conversionRate.change >= 0 ? 'up' : 'down',
        },
        {
          id: 'pipeline-value',
          label: 'Pipeline Valor',
          value: raw.pipelineValue.value,
          previousValue: Math.round(raw.pipelineValue.value / (1 + raw.pipelineValue.change / 100)),
          change: Math.abs(raw.pipelineValue.change),
          changeType: raw.pipelineValue.change >= 0 ? 'positive' : 'negative',
          format: 'currency',
          trend: raw.pipelineValue.change >= 0 ? 'up' : 'down',
        },
        {
          id: 'avg-conversion-time',
          label: 'Tempo Médio',
          value: Math.round(raw.avgDealTime.value * 10) / 10,
          previousValue: Math.round((raw.avgDealTime.value / (1 + raw.avgDealTime.change / 100)) * 10) / 10,
          change: Math.abs(raw.avgDealTime.change),
          // Para tempo de conversão, menos dias é positivo
          changeType: raw.avgDealTime.change <= 0 ? 'positive' : 'negative',
          format: 'duration',
          suffix: ' dias',
          trend: raw.avgDealTime.change <= 0 ? 'down' : 'up',
        },
      ],
      lastUpdated: new Date().toISOString(),
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
