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

function calcChange(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prev) / prev) * 100)
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const period = request.nextUrl.searchParams.get('period') ?? '24h'

    const periodStart = getPeriodStart(period)
    const now = new Date()
    const durationMs = now.getTime() - periodStart.getTime()
    const prevStart = new Date(periodStart.getTime() - durationMs)

    // Conversas — Conversation tem organizationId direto, Prisma ORM funciona aqui
    const [
      conversasAbertas, conversasFechadas, conversasAtivas, conversasSemAtribuicao,
      prevConversasAbertas, prevConversasFechadas,
    ] = await Promise.all([
      prisma.conversation.count({ where: { organizationId, createdAt: { gte: periodStart } } }),
      prisma.conversation.count({ where: { organizationId, status: 'closed', updatedAt: { gte: periodStart } } }),
      prisma.conversation.count({ where: { organizationId, status: 'active' } }),
      prisma.conversation.count({ where: { organizationId, status: 'active', assignedTo: null } }),
      prisma.conversation.count({ where: { organizationId, createdAt: { gte: prevStart, lt: periodStart } } }),
      prisma.conversation.count({ where: { organizationId, status: 'closed', updatedAt: { gte: prevStart, lt: periodStart } } }),
    ])

    // Mensagens — Message não tem organizationId, usa JOIN + cast explícito ::uuid / ::timestamptz
    const msgCounts = await prisma.$queryRawUnsafe<Array<{ direction: string; total: bigint }>>(
      `SELECT m.direction, COUNT(*) AS total
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.organization_id = $1::uuid
         AND m.created_at >= $2::timestamptz
       GROUP BY m.direction`,
      organizationId, periodStart
    )

    const mensagensRecebidas = Number(msgCounts.find(r => r.direction === 'INBOUND')?.total  ?? 0)
    const mensagensEnviadas  = Number(msgCounts.find(r => r.direction === 'OUTBOUND')?.total ?? 0)

    // TMR: tempo médio entre primeiro INBOUND e primeiro OUTBOUND humano por conversa
    const tmrRows = await prisma.$queryRawUnsafe<Array<{ diff_seconds: number | null }>>(
      `SELECT
         EXTRACT(EPOCH FROM (
           MIN(CASE WHEN m.direction = 'OUTBOUND'
                    AND (m.content IS NULL OR m.content NOT LIKE '[Template:%')
               THEN m.created_at END)
           - MIN(CASE WHEN m.direction = 'INBOUND' THEN m.created_at END)
         ))::int AS diff_seconds
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE c.organization_id = $1::uuid
         AND c.created_at >= $2::timestamptz
       GROUP BY m.conversation_id
       HAVING
         MIN(CASE WHEN m.direction = 'INBOUND' THEN m.created_at END) IS NOT NULL
         AND MIN(CASE WHEN m.direction = 'OUTBOUND'
                      AND (m.content IS NULL OR m.content NOT LIKE '[Template:%')
                 THEN m.created_at END) IS NOT NULL`,
      organizationId, periodStart
    )

    const validDeltas = tmrRows
      .map(r => r.diff_seconds)
      .filter((d): d is number => d !== null && d > 0)
    const tmrSegundos = validDeltas.length > 0
      ? Math.round(validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length)
      : 0

    const taxaResolucao     = conversasAbertas > 0 ? Math.round((conversasFechadas / conversasAbertas) * 100) : 0
    const prevTaxaResolucao = prevConversasAbertas > 0 ? Math.round((prevConversasFechadas / prevConversasAbertas) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        period, periodStart,
        conversasAbertas:    { value: conversasAbertas,    change: calcChange(conversasAbertas, prevConversasAbertas) },
        conversasFechadas:   { value: conversasFechadas,   change: calcChange(conversasFechadas, prevConversasFechadas) },
        conversasAtivas,
        conversasSemAtribuicao,
        taxaResolucao:       { value: taxaResolucao,       change: calcChange(taxaResolucao, prevTaxaResolucao) },
        tmrSegundos,
        mensagensRecebidas,
        mensagensEnviadas,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode })
    }
    console.error('GET /api/reports/atendimento error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar relatório de atendimento' }, { status: 500 })
  }
}
