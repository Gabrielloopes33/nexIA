import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRLS } from '@/lib/db/rls'
import { getOrganizationId, AuthError } from '@/lib/auth/helpers'

function getPeriodStart(period: string): Date {
  const now = new Date()
  const hoursMap: Record<string, number> = {
    '3h': 3, '6h': 6, '12h': 12, '24h': 24, '7d': 168, '30d': 720,
  }
  return new Date(now.getTime() - (hoursMap[period] ?? 168) * 3_600_000)
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId()
    const period     = request.nextUrl.searchParams.get('period')     ?? '7d'
    const campaignId = request.nextUrl.searchParams.get('campaignId') ?? null

    const periodStart = getPeriodStart(period)
    const now = new Date()
    const windowMs = 24 * 3_600_000

    // Campanhas no período
    const campaigns = await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.findMany({
        where: {
          organizationId,
          ...(campaignId ? { id: campaignId } : {}),
          status: { in: ['COMPLETED', 'RUNNING', 'FAILED'] },
          OR: [
            { startedAt:   { gte: periodStart } },
            { completedAt: { gte: periodStart } },
            { createdAt:   { gte: periodStart } },
          ],
        },
        include: { tag: true },
        orderBy: { startedAt: 'desc' },
      })
    })

    const campanhasComMetricas = await Promise.all(campaigns.map(async (campaign) => {
      // Contatos da campanha — conversation_id vem da coluna adicionada via migration
      const contacts = await prisma.$queryRawUnsafe<Array<{
        id: string
        contact_id: string
        phone: string
        name: string | null
        status: string
        sent_at: Date | null
        failed_at: Date | null
        conversation_id: string | null
      }>>(
        `SELECT id, contact_id::text, phone, name, status, sent_at, failed_at, conversation_id::text
         FROM campaign_contacts
         WHERE campaign_id = $1::uuid`,
        campaign.id
      )

      const enviados = contacts.filter(c => c.status === 'SENT')
      const falhas   = contacts.filter(c => c.status === 'FAILED')

      // Mapear contactId → conversationId (explícito primeiro, heurística depois)
      const conversationIds = new Map<string, string>()
      for (const cc of enviados) {
        if (cc.conversation_id) conversationIds.set(cc.contact_id, cc.conversation_id)
      }

      const semConv = enviados.filter(cc => !cc.conversation_id && cc.sent_at)
      if (semConv.length > 0) {
        const contactIdList = semConv.map(cc => cc.contact_id)
        // Referência de tempo: menor sent_at do lote
        const refTime = semConv.reduce<Date>((min, cc) =>
          cc.sent_at && new Date(cc.sent_at) < min ? new Date(cc.sent_at) : min,
          new Date(semConv[0].sent_at!)
        )
        // Heurística: conversa criada em até 2h após o envio para o mesmo contato
        const hRows = await prisma.$queryRawUnsafe<Array<{ contact_id: string; id: string }>>(
          `SELECT DISTINCT ON (contact_id) contact_id::text, id::text
           FROM conversations
           WHERE organization_id = $1::uuid
             AND contact_id = ANY($2::uuid[])
             AND created_at >= $3::timestamptz - interval '30 minutes'
             AND created_at <= $3::timestamptz + interval '2 hours'
           ORDER BY contact_id, created_at ASC`,
          organizationId, contactIdList, refTime
        )
        for (const row of hRows) {
          if (!conversationIds.has(row.contact_id)) conversationIds.set(row.contact_id, row.id)
        }
      }

      // Verificar replies em lote — uma única query para todas as conversas
      const allConvIds = Array.from(conversationIds.values())
      const replyMap = new Map<string, { got_reply: boolean; first_reply_seconds: number | null }>()

      if (allConvIds.length > 0) {
        const replyRows = await prisma.$queryRawUnsafe<Array<{
          conversation_id: string
          got_reply: boolean
          first_reply_seconds: number | null
        }>>(
          `SELECT
             c.id::text AS conversation_id,
             EXISTS(
               SELECT 1 FROM messages m2
               WHERE m2.conversation_id = c.id
                 AND m2.direction = 'INBOUND'
                 AND m2.created_at <= c.created_at + interval '24 hours'
             ) AS got_reply,
             EXTRACT(EPOCH FROM (
               MIN(CASE WHEN m.direction = 'INBOUND' THEN m.created_at END) - c.created_at
             ))::int AS first_reply_seconds
           FROM conversations c
           LEFT JOIN messages m ON m.conversation_id = c.id AND m.direction = 'INBOUND'
           WHERE c.id = ANY($1::uuid[])
           GROUP BY c.id`,
          allConvIds
        )
        for (const row of replyRows) {
          replyMap.set(row.conversation_id, {
            got_reply: row.got_reply,
            first_reply_seconds: row.first_reply_seconds,
          })
        }
      }

      // Montar detalhes por contato
      const contatos = enviados.map(cc => {
        const convId    = conversationIds.get(cc.contact_id) ?? null
        const replyInfo = convId ? replyMap.get(convId) : null
        const gotReply  = replyInfo?.got_reply ?? false
        const windowEnd = cc.sent_at ? new Date(new Date(cc.sent_at).getTime() + windowMs) : null
        const windowExpired = windowEnd ? windowEnd < now : false
        return {
          contactId: cc.contact_id,
          phone: cc.phone,
          name: cc.name,
          status: cc.status,
          sentAt: cc.sent_at,
          gotReply,
          windowExpired,
          replyTimeSeconds: gotReply ? (replyInfo?.first_reply_seconds ?? null) : null,
          conversationId: convId,
        }
      })

      const janelasAbertas      = enviados.length
      const janelasAproveitadas = contatos.filter(c => c.gotReply).length
      const janelasExpiradas    = contatos.filter(c => !c.gotReply && c.windowExpired).length
      const janelasAtivas       = contatos.filter(c => !c.gotReply && !c.windowExpired).length

      const replyTimes = contatos.map(c => c.replyTimeSeconds).filter((t): t is number => t !== null && t > 0)
      const tmrContatoSegundos  = replyTimes.length > 0
        ? Math.round(replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length)
        : 0

      const taxaEngajamento = janelasAbertas > 0 ? Math.round((janelasAproveitadas / janelasAbertas) * 100) : 0
      const taxaEntrega     = campaign.totalContacts > 0 ? Math.round((janelasAbertas / campaign.totalContacts) * 100) : 0

      const conversoes = await prisma.deal.count({
        where: {
          organizationId,
          contactId: { in: enviados.map(c => c.contact_id) },
          createdAt: { gte: campaign.startedAt ?? campaign.createdAt },
        },
      })

      return {
        id: campaign.id,
        nome: campaign.name,
        templateName: campaign.templateName,
        status: campaign.status,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
        tag: campaign.tag?.name ?? null,
        totalContatos: campaign.totalContacts,
        enviados: janelasAbertas,
        falhas: falhas.length,
        janelasAbertas,
        janelasAproveitadas,
        janelasExpiradas,
        janelasAtivas,
        taxaEngajamento,
        taxaEntrega,
        tmrContatoSegundos,
        conversoes,
        ...(campaignId ? { contatos } : {}),
      }
    }))

    const consolidado = {
      totalCampanhas:           campanhasComMetricas.length,
      totalEnviados:            campanhasComMetricas.reduce((s, c) => s + c.enviados, 0),
      totalFalhas:              campanhasComMetricas.reduce((s, c) => s + c.falhas, 0),
      totalJanelasAbertas:      campanhasComMetricas.reduce((s, c) => s + c.janelasAbertas, 0),
      totalJanelasAproveitadas: campanhasComMetricas.reduce((s, c) => s + c.janelasAproveitadas, 0),
      totalJanelasExpiradas:    campanhasComMetricas.reduce((s, c) => s + c.janelasExpiradas, 0),
      totalConversoes:          campanhasComMetricas.reduce((s, c) => s + c.conversoes, 0),
      taxaEngajamentoMedia: campanhasComMetricas.length > 0
        ? Math.round(campanhasComMetricas.reduce((s, c) => s + c.taxaEngajamento, 0) / campanhasComMetricas.length)
        : 0,
    }

    return NextResponse.json({
      success: true,
      data: { period, periodStart, consolidado, campanhas: campanhasComMetricas },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode })
    }
    console.error('GET /api/reports/campaigns-performance error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar performance de campanhas' }, { status: 500 })
  }
}
