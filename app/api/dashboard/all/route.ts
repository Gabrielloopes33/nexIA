/**
 * GET /api/dashboard/all
 * Retorna todas as métricas consolidadas (para cache)
 * Query params: organizationId (obrigatório)
 * 
 * Este endpoint é ideal para prefetch/cache de todas as métricas
 * em uma única requisição.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllDashboardMetrics } from '@/lib/db/dashboard-queries'
import { prisma } from '@/lib/prisma'

// Cache por 5 minutos (300 segundos)
export const revalidate = 300
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar cache (opcional - pode ser implementado via Redis)
    const cached = await prisma.dashboardMetricCache.findFirst({
      where: {
        organizationId,
        metricType: 'all',
        period: 'current',
        expiresAt: { gt: new Date() },
      },
    })

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          cached: true,
          cachedAt: cached.createdAt.toISOString(),
          expiresAt: cached.expiresAt.toISOString(),
        },
      })
    }

    // Busca todas as métricas em paralelo
    const metrics = await getAllDashboardMetrics(organizationId)

    // Salva no cache
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
    await prisma.dashboardMetricCache.upsert({
      where: {
        organizationId_metricType_period: {
          organizationId,
          metricType: 'all',
          period: 'current',
        },
      },
      update: {
        data: metrics as any,
        expiresAt,
      },
      create: {
        organizationId,
        metricType: 'all',
        period: 'current',
        data: metrics as any,
        expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Dashboard All] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar métricas' },
      { status: 500 }
    )
  }
}
