/**
 * POST /api/admin/fix-conversations
 *
 * Migração retroativa para corrigir conversas de disparos:
 *   1. Corrige conteúdo das mensagens de template (de "nome_template" para "[Template: nome_template]")
 *   2. Mescla conversas duplicadas do mesmo contato na mais recente
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const organizationId = user.organizationId

    // ─── 1. Corrigir conteúdo das mensagens de campanha ───────────────────────

    // Busca todos os nomes de templates usados em campanhas desta organização
    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      select: { templateName: true },
      distinct: ['templateName'],
    })

    const templateNames = campaigns.map((c) => c.templateName)

    let messagesFixed = 0

    if (templateNames.length > 0) {
      // Busca conversas desta organização
      const conversationIds = await prisma.conversation
        .findMany({
          where: { organizationId },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id))

      // Para cada template, atualiza mensagens OUTBOUND cujo conteúdo é o nome puro do template
      for (const templateName of templateNames) {
        const result = await prisma.message.updateMany({
          where: {
            conversationId: { in: conversationIds },
            direction: 'OUTBOUND',
            content: templateName, // conteúdo exato sem colchetes = formato antigo
          },
          data: {
            content: `[Template: ${templateName}]`,
          },
        })
        messagesFixed += result.count
      }
    }

    // ─── 2. Mesclar conversas duplicadas ──────────────────────────────────────

    // Busca contatos desta organização que têm mais de uma conversa ativa
    const duplicates = await prisma.conversation.groupBy({
      by: ['contactId'],
      where: { organizationId, status: 'active' },
      having: { contactId: { _count: { gt: 1 } } },
      _count: { contactId: true },
    })

    let contactsMerged = 0
    let conversationsClosed = 0
    let messagesMoved = 0

    for (const dup of duplicates) {
      try {
        // Busca todas as conversas ativas deste contato, mais recente primeiro
        const conversations = await prisma.conversation.findMany({
          where: { organizationId, contactId: dup.contactId, status: 'active' },
          orderBy: { createdAt: 'desc' },
        })

        if (conversations.length < 2) continue

        // A mais recente é a principal
        const primary = conversations[0]
        const toMerge = conversations.slice(1)
        const toMergeIds = toMerge.map((c) => c.id)

        // Move todas as mensagens das conversas antigas para a principal
        const moved = await prisma.message.updateMany({
          where: { conversationId: { in: toMergeIds } },
          data: { conversationId: primary.id },
        })
        messagesMoved += moved.count

        // Fecha as conversas antigas
        await prisma.conversation.updateMany({
          where: { id: { in: toMergeIds } },
          data: { status: 'closed' },
        })

        conversationsClosed += toMergeIds.length
        contactsMerged++
      } catch (err) {
        console.error('[fix-conversations] Erro ao mesclar contato:', dup.contactId, err)
      }
    }

    console.log(
      `[fix-conversations] org=${organizationId} messagesFixed=${messagesFixed} contactsMerged=${contactsMerged} conversationsClosed=${conversationsClosed} messagesMoved=${messagesMoved}`
    )

    return NextResponse.json({
      success: true,
      data: {
        messagesFixed,
        contactsMerged,
        conversationsClosed,
        messagesMoved,
      },
    })
  } catch (error) {
    console.error('POST /api/admin/fix-conversations error:', error)
    return NextResponse.json({ success: false, error: 'Falha na migração' }, { status: 500 })
  }
}
