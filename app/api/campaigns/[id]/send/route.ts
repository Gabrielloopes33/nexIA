import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRLS } from '@/lib/db/rls'
import { getOrganizationId } from '@/lib/auth/helpers'
import { sendTemplateMessage } from '@/lib/whatsapp/cloud-api'
import { ensureLeadCapturado } from '@/lib/pipeline/lead-automation'

export const maxDuration = 300

interface Params { params: Promise<{ id: string }> }

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const organizationId = await getOrganizationId()
    const { id } = await params

    // Fetch campaign
    const campaign = await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.findFirst({ where: { id, organizationId } })
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json({ success: false, error: 'Campaign is not in DRAFT status' }, { status: 400 })
    }

    // Fetch instance credentials
    const instance = await withRLS(prisma, organizationId, async (tx) => {
      return tx.whatsAppInstance.findFirst({
        where: { id: campaign.instanceId, organizationId, status: 'CONNECTED' },
        select: { phoneNumberId: true, accessToken: true },
      })
    })

    if (!instance?.phoneNumberId || !instance?.accessToken) {
      return NextResponse.json({ success: false, error: 'WhatsApp instance not connected or missing credentials' }, { status: 400 })
    }

    // Set campaign to RUNNING
    await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.update({
        where: { id },
        data: { status: 'RUNNING', startedAt: new Date() },
      })
    })

    // Fetch pending contacts in batches
    let sentCount = 0
    let failedCount = 0
    const batchSize = 100

    while (true) {
      const batch = await withRLS(prisma, organizationId, async (tx) => {
        return tx.campaignContact.findMany({
          where: { campaignId: id, status: 'PENDING' },
          take: batchSize,
        })
      })

      if (batch.length === 0) break

      for (const contact of batch) {
        try {
          // Only pass components that have actual parameter substitutions (not template structure)
          const rawComponents = campaign.templateComponents as any[] | null | undefined
          const sendComponents = Array.isArray(rawComponents)
            ? rawComponents.filter((c: any) => Array.isArray(c?.parameters) && c.parameters.length > 0)
            : undefined
          const result = await sendTemplateMessage({
            instance: { phoneNumberId: instance.phoneNumberId, accessToken: instance.accessToken } as any,
            to: contact.phone,
            templateName: campaign.templateName,
            language: campaign.templateLanguage,
            components: sendComponents?.length ? sendComponents : undefined,
          })

          if (!result.success) {
            throw new Error(result.error || 'Send failed')
          }

          const messageId = result.messageId || null

          await withRLS(prisma, organizationId, async (tx) => {
            await tx.campaignContact.update({
              where: { id: contact.id },
              data: { status: 'SENT', externalMessageId: messageId, sentAt: new Date() },
            })
            return tx.campaign.update({
              where: { id },
              data: { sentCount: { increment: 1 }, pendingCount: { decrement: 1 } },
            })
          })

          // Criar ou encontrar conversa + mensagem para o contato
          try {
            let existingConversation = await prisma.conversation.findFirst({
              where: { contactId: contact.contactId, organizationId, status: 'active' },
            })
            if (!existingConversation) {
              existingConversation = await prisma.conversation.create({
                data: { organizationId, contactId: contact.contactId, status: 'active' },
              })
            }
            await prisma.message.create({
              data: {
                conversationId: existingConversation.id,
                contactId: contact.contactId,
                content: campaign.templateName,
                direction: 'OUTBOUND',
                status: 'sent',
                messageId: messageId || undefined,
              },
            })
          } catch (convErr) {
            console.error('Error creating conversation for campaign contact:', convErr)
          }

          // Criar deal em Lead Capturado (se o contato ainda não tiver deal aberto)
          await ensureLeadCapturado(
            organizationId,
            contact.contactId,
            contact.name || contact.phone,
            campaign.createdBy
          )

          sentCount++
        } catch (err: any) {
          const errorMessage = err?.message || 'Send failed'

          await withRLS(prisma, organizationId, async (tx) => {
            await tx.campaignContact.update({
              where: { id: contact.id },
              data: { status: 'FAILED', errorMessage, failedAt: new Date() },
            })
            return tx.campaign.update({
              where: { id },
              data: { failedCount: { increment: 1 }, pendingCount: { decrement: 1 } },
            })
          })

          failedCount++
        }

        await sleep(250) // Respeita rate limit da Meta
      }
    }

    const finalStatus = sentCount === 0 ? 'FAILED' : 'COMPLETED'

    await withRLS(prisma, organizationId, async (tx) => {
      return tx.campaign.update({
        where: { id },
        data: { status: finalStatus, completedAt: new Date() },
      })
    })

    return NextResponse.json({
      success: true,
      data: { sent: sentCount, failed: failedCount, total: campaign.totalContacts },
    })
  } catch (error) {
    console.error('POST /api/campaigns/[id]/send error:', error)

    // Tentar marcar como FAILED
    try {
      const organizationId = await getOrganizationId()
      const { id } = await params
      await withRLS(prisma, organizationId, async (tx) => {
        return tx.campaign.update({ where: { id }, data: { status: 'FAILED', completedAt: new Date() } })
      })
    } catch {}

    return NextResponse.json({ success: false, error: 'Failed to send campaign' }, { status: 500 })
  }
}
