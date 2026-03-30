/**
 * Lead Automation - Lógica de CRM automático
 *
 * Regras:
 * 1. Ao disparar uma campanha → cria Conversation + Deal em "Lead Capturado" (1ª etapa)
 * 2. Ao receber resposta (mensagem INBOUND) → move deal para "Lead Engajado" (2ª etapa)
 */

import { prisma } from '@/lib/prisma'

/**
 * Retorna o userId do primeiro OWNER da organização.
 * Usado como createdBy em deals criados automaticamente pelo sistema.
 */
async function getOrgOwnerId(organizationId: string): Promise<string | null> {
  const member = await prisma.organizationMember.findFirst({
    where: { organizationId, role: 'OWNER', status: 'ACTIVE' },
    select: { userId: true },
  })
  return member?.userId ?? null
}

/**
 * Retorna as duas primeiras etapas do pipeline da organização (por posição).
 * [0] = Lead Capturado, [1] = Lead Engajado
 */
async function getLeadStages(organizationId: string) {
  const stages = await prisma.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { position: 'asc' },
    take: 2,
  })
  return {
    leadCapturado: stages[0] ?? null,
    leadEngajado: stages[1] ?? null,
  }
}

/**
 * Cria um deal em "Lead Capturado" para o contato, se ele ainda não tiver nenhum deal OPEN.
 * Retorna o deal criado (ou null se já existia).
 */
export async function ensureLeadCapturado(
  organizationId: string,
  contactId: string,
  dealTitle: string,
  createdBy?: string
): Promise<boolean> {
  try {
    // Verifica se o contato já tem deal aberto
    const existingDeal = await prisma.deal.findFirst({
      where: { organizationId, contactId, status: 'OPEN' },
    })
    if (existingDeal) return false

    const { leadCapturado } = await getLeadStages(organizationId)
    if (!leadCapturado) {
      console.warn('[LeadAutomation] Nenhuma etapa de pipeline encontrada para org:', organizationId)
      return false
    }

    const userId = createdBy ?? (await getOrgOwnerId(organizationId))
    if (!userId) {
      console.warn('[LeadAutomation] Nenhum owner encontrado para org:', organizationId)
      return false
    }

    await prisma.deal.create({
      data: {
        organizationId,
        contactId,
        stageId: leadCapturado.id,
        title: dealTitle,
        status: 'OPEN',
        createdBy: userId,
        channel: 'WHATSAPP_OFFICIAL',
        source: 'campanha',
      },
    })

    console.log('[LeadAutomation] Deal criado em Lead Capturado para contato:', contactId)
    return true
  } catch (err) {
    console.error('[LeadAutomation] Erro ao criar deal em Lead Capturado:', err)
    return false
  }
}

/**
 * Garante que a tag de campanha existe para a organização e está atribuída ao contato.
 * Cria a tag se não existir. Silenciosamente ignora se o contato já tem a tag.
 */
export async function ensureCampaignTag(
  organizationId: string,
  contactId: string,
  tagName: string = 'NR1_Disparo Feito',
  assignedBy?: string
): Promise<void> {
  try {
    // Find or create the tag
    const tag = await prisma.tag.upsert({
      where: { organizationId_name: { organizationId, name: tagName } },
      update: {},
      create: {
        organizationId,
        name: tagName,
        color: '#f59e0b',
        source: 'campanha',
      },
    })

    // Assign tag to contact (ignore if already assigned)
    const existing = await prisma.contactTag.findUnique({
      where: { contactId_tagId: { contactId, tagId: tag.id } },
    })

    if (!existing) {
      await prisma.contactTag.create({
        data: { contactId, tagId: tag.id, assignedBy: assignedBy ?? null },
      })

      // Also keep the legacy String[] array in sync
      const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { tags: true } })
      if (contact && !contact.tags.includes(tagName)) {
        await prisma.contact.update({
          where: { id: contactId },
          data: { tags: [...contact.tags, tagName] },
        })
      }
    }

    console.log('[LeadAutomation] Tag atribuída ao contato:', { contactId, tagName })
  } catch (err) {
    console.error('[LeadAutomation] Erro ao atribuir tag de campanha:', err)
  }
}

/**
 * Promove o deal aberto do contato de "Lead Capturado" (1ª etapa) para "Lead Engajado" (2ª etapa).
 * Só move se o deal estiver exatamente na 1ª etapa — não faz downgrade.
 */
export async function promoteToLeadEngajado(
  organizationId: string,
  contactId: string
): Promise<boolean> {
  try {
    const { leadCapturado, leadEngajado } = await getLeadStages(organizationId)
    if (!leadCapturado || !leadEngajado) return false

    // Busca deal aberto do contato que ainda está em Lead Capturado
    const deal = await prisma.deal.findFirst({
      where: { organizationId, contactId, status: 'OPEN', stageId: leadCapturado.id },
    })
    if (!deal) return false

    const userId = await getOrgOwnerId(organizationId)

    await prisma.deal.update({
      where: { id: deal.id },
      data: { stageId: leadEngajado.id, updatedAt: new Date() },
    })

    // Registra atividade de mudança de etapa
    if (userId) {
      await prisma.dealActivity.create({
        data: {
          dealId: deal.id,
          user_id: userId,
          type: 'STAGE_CHANGE',
          description: `Lead respondeu → movido para "${leadEngajado.name}" automaticamente`,
          metadata: {
            fromStageId: leadCapturado.id,
            fromStageName: leadCapturado.name,
            toStageId: leadEngajado.id,
            toStageName: leadEngajado.name,
            trigger: 'inbound_message',
          },
        },
      })
    }

    console.log('[LeadAutomation] Deal promovido para Lead Engajado, contato:', contactId)
    return true
  } catch (err) {
    console.error('[LeadAutomation] Erro ao promover deal para Lead Engajado:', err)
    return false
  }
}
