import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationId, AuthError } from '@/lib/auth/helpers'

function getPeriodStart(period: string): Date {
  const now = new Date()
  const hoursMap: Record<string, number> = {
    '3h': 3, '6h': 6, '12h': 12, '24h': 24, '7d': 168, '30d': 720,
  }
  return new Date(now.getTime() - (hoursMap[period] ?? 24) * 3_600_000)
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const period  = request.nextUrl.searchParams.get('period')  ?? '24h'
    const groupBy = request.nextUrl.searchParams.get('groupBy') ?? 'hour'

    const periodStart = getPeriodStart(period)
    const truncFn = groupBy === 'day' ? 'day' : 'hour'

    // Fluxo de novas conversas agrupadas por bucket de tempo e produto/canal
    const flowRows = await prisma.$queryRawUnsafe<Array<{
      bucket: Date
      product_id: string | null
      product_name: string | null
      count: bigint
    }>>(
      `SELECT
         date_trunc($1, c.created_at AT TIME ZONE 'UTC') AS bucket,
         c.product_id::text,
         p.name AS product_name,
         COUNT(*) AS count
       FROM conversations c
       LEFT JOIN products p ON p.id = c.product_id
       WHERE c.organization_id = $2::uuid
         AND c.created_at >= $3::timestamptz
       GROUP BY bucket, c.product_id, p.name
       ORDER BY bucket ASC`,
      truncFn, organizationId, periodStart
    )

    // Heatmap: volume de mensagens INBOUND por hora × dia da semana
    const heatmapRows = await prisma.$queryRawUnsafe<Array<{
      dow: number; hour: number; count: bigint
    }>>(
      `SELECT
         EXTRACT(DOW  FROM m.created_at AT TIME ZONE 'UTC')::int AS dow,
         EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'UTC')::int AS hour,
         COUNT(*) AS count
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.organization_id = $1::uuid
         AND m.direction = 'INBOUND'
         AND m.created_at >= $2::timestamptz
       GROUP BY dow, hour
       ORDER BY dow, hour`,
      organizationId, periodStart
    )

    // Canais únicos
    const channelMap = new Map<string, string>()
    for (const row of flowRows) {
      channelMap.set(row.product_id ?? 'sem-canal', row.product_name ?? 'Sem canal')
    }
    const channels = Array.from(channelMap.entries()).map(([id, name]) => ({ id, name }))

    // Pivotar por bucket
    const bucketMap = new Map<string, Record<string, number>>()
    for (const row of flowRows) {
      const key = new Date(row.bucket).toISOString()
      if (!bucketMap.has(key)) bucketMap.set(key, {})
      bucketMap.get(key)![row.product_id ?? 'sem-canal'] = Number(row.count)
    }

    const flow = Array.from(bucketMap.entries()).map(([bucket, counts]) => ({
      bucket,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      ...counts,
    }))

    const heatmap = heatmapRows.map(r => ({ dow: r.dow, hour: r.hour, count: Number(r.count) }))
    const totalNovas = flowRows.reduce((sum, r) => sum + Number(r.count), 0)

    return NextResponse.json({
      success: true,
      data: { period, groupBy, periodStart, totalNovas, channels, flow, heatmap },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode })
    }
    console.error('GET /api/reports/lead-flow error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar fluxo de leads' }, { status: 500 })
  }
}
