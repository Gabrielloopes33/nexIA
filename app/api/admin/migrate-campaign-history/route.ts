/**
 * POST /api/admin/migrate-campaign-history
 *
 * Migração retroativa: para cada CampaignContact com status SENT,
 * garante que existe:
 *   1. Conversa ativa para o contato
 *   2. Mensagem OUTBOUND registrada (usando externalMessageId para evitar duplicata)
 *   3. Deal em Lead Capturado no pipeline
 *   4. Tag "NR1_Disparo Feito" atribuída ao contato
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/helpers'
import { ensureLeadCapturado, ensureCampaignTag } from '@/lib/pipeline/lead-automation'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId

    // Busca todos os disparos SENT da organização, junto com dados da campanha
    const sentContacts = await prisma.campaignContact.findMany({
      where: {
        campaign: { organizationId },
        status: 'SENT',
      },
      select: {
        id: true,
        contactId: true,
        phone: true,
        name: true,
        externalMessageId: true,
        sentAt: true,
        campaign: {
          select: {
            organizationId: true,
            templateName: true,
            createdBy: true,
          },
        },
      },
    })

    if (sentContacts.length === 0) {
      return NextResponse.json({ success: true, data: { processed: 0, skipped: 0 } })
    }

    let conversations = 0
    let messages = 0
    let deals = 0
    let tags = 0
    let skipped = 0

    for (const cc of sentContacts) {
      try {
        const { organizationId: orgId, templateName, createdBy } = cc.campaign

        // 1. Find or create active conversation
        let conversation = await prisma.conversation.findFirst({
          where: { contactId: cc.contactId, organizationId: orgId, status: 'active' },
        })
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { organizationId: orgId, contactId: cc.contactId, status: 'active' },
          })
          conversations++
        }

        // 2. Find or create OUTBOUND message (check by externalMessageId to avoid duplicates)
        const existingMsg = cc.externalMessageId
          ? await prisma.message.findFirst({ where: { messageId: cc.externalMessageId } })
          : await prisma.message.findFirst({
              where: {
                conversationId: conversation.id,
                contactId: cc.contactId,
                direction: 'OUTBOUND',
                content: templateName,
              },
            })

        if (!existingMsg) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              contactId: cc.contactId,
              content: templateName,
              direction: 'OUTBOUND',
              status: 'sent',
              messageId: cc.externalMessageId ?? undefined,
            },
          })
          messages++
        }

        // 3. Ensure deal in Lead Capturado
        const dealCreated = await ensureLeadCapturado(
          orgId,
          cc.contactId,
          cc.name || cc.phone,
          createdBy
        )
        if (dealCreated) deals++

        // 4. Ensure tag "NR1_Disparo Feito"
        const tagsBefore = tags
        await ensureCampaignTag(orgId, cc.contactId, 'NR1_Disparo Feito', createdBy)
        // ensureCampaignTag logs internally; we'll just increment counter approximate
        tags++ // optimistic — ensureCampaignTag ignores duplicates silently
      } catch (err) {
        console.error('[MigrateCampaignHistory] Erro ao processar contato:', cc.contactId, err)
        skipped++
      }
    }

    console.log(`[MigrateCampaignHistory] org=${organizationId} total=${sentContacts.length} conversations=${conversations} messages=${messages} deals=${deals} skipped=${skipped}`)

    return NextResponse.json({
      success: true,
      data: {
        total: sentContacts.length,
        conversations,
        messages,
        deals,
        tags,
        skipped,
      },
    })
  } catch (error) {
    console.error('POST /api/admin/migrate-campaign-history error:', error)
    return NextResponse.json({ success: false, error: 'Falha na migração' }, { status: 500 })
  }
}
