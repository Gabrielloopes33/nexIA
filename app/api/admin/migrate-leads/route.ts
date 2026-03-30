/**
 * POST /api/admin/migrate-leads
 *
 * Migração única: popula o pipeline CRM com todos os contatos existentes.
 *
 * Regras:
 * - Contatos sem deal aberto → cria deal em "Lead Capturado" (1ª etapa)
 * - Contatos que já responderam (têm mensagem INBOUND) → deal vai direto para "Lead Engajado" (2ª etapa)
 * - Contatos que já têm deal aberto → ignorados
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationId, getAuthenticatedUser } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId

    // Busca as duas primeiras etapas do pipeline (Lead Capturado + Lead Engajado)
    const stages = await prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { position: 'asc' },
      take: 2,
    })

    if (stages.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma etapa de pipeline encontrada. Configure o pipeline primeiro.' },
        { status: 400 }
      )
    }

    const leadCapturado = stages[0]
    const leadEngajado = stages[1] ?? null

    // Busca todos os contatos ativos da organização
    const contacts = await prisma.contact.findMany({
      where: { organizationId, status: 'ACTIVE', deletedAt: null },
      select: { id: true, name: true, phone: true },
    })

    if (contacts.length === 0) {
      return NextResponse.json({ success: true, data: { created: 0, promoted: 0, skipped: 0 } })
    }

    const contactIds = contacts.map((c) => c.id)

    // IDs de contatos que já têm deal OPEN (não serão recriados)
    const existingDeals = await prisma.deal.findMany({
      where: { organizationId, contactId: { in: contactIds }, status: 'OPEN' },
      select: { contactId: true, stageId: true },
    })
    const contactsWithDeal = new Set(existingDeals.map((d) => d.contactId))

    // IDs de contatos que já responderam (têm pelo menos uma mensagem INBOUND)
    const inboundMessages = await prisma.message.findMany({
      where: {
        contactId: { in: contactIds },
        direction: 'INBOUND',
      },
      select: { contactId: true },
      distinct: ['contactId'],
    })
    const contactsWhoReplied = new Set(inboundMessages.map((m) => m.contactId))

    // Contatos sem deal aberto que precisam ser criados
    const contactsToCreate = contacts.filter((c) => !contactsWithDeal.has(c.id))

    let created = 0
    let promoted = 0
    const skipped = contacts.length - contactsToCreate.length

    // Cria deals em batch
    if (contactsToCreate.length > 0) {
      const dealData = contactsToCreate.map((c) => ({
        organizationId,
        contactId: c.id,
        stageId: leadEngajado && contactsWhoReplied.has(c.id)
          ? leadEngajado.id
          : leadCapturado.id,
        title: c.name || c.phone,
        status: 'OPEN' as const,
        createdBy: user.userId,
        channel: 'WHATSAPP_OFFICIAL' as const,
        source: 'migracao',
      }))

      await prisma.deal.createMany({ data: dealData, skipDuplicates: true })

      created = dealData.length
      promoted = dealData.filter(
        (d) => leadEngajado && d.stageId === leadEngajado.id
      ).length
    }

    // Para contatos que JÁ tinham deal em Lead Capturado mas responderam → promover
    if (leadEngajado) {
      const dealsToPromote = existingDeals.filter(
        (d) => d.stageId === leadCapturado.id && contactsWhoReplied.has(d.contactId)
      )

      if (dealsToPromote.length > 0) {
        const contactIdsToPromote = dealsToPromote.map((d) => d.contactId)
        await prisma.deal.updateMany({
          where: {
            organizationId,
            contactId: { in: contactIdsToPromote },
            stageId: leadCapturado.id,
            status: 'OPEN',
          },
          data: { stageId: leadEngajado.id, updatedAt: new Date() },
        })
        promoted += dealsToPromote.length
      }
    }

    console.log(`[MigrateLeads] org=${organizationId} created=${created} promoted=${promoted} skipped=${skipped}`)

    return NextResponse.json({
      success: true,
      data: {
        total: contacts.length,
        created,
        promoted,
        skipped,
        stages: {
          leadCapturado: leadCapturado.name,
          leadEngajado: leadEngajado?.name ?? '(sem 2ª etapa)',
        },
      },
    })
  } catch (error) {
    console.error('POST /api/admin/migrate-leads error:', error)
    return NextResponse.json({ success: false, error: 'Falha na migração' }, { status: 500 })
  }
}
