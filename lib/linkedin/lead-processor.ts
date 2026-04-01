/**
 * LinkedIn Lead Processor
 * Processa leads recebidos do LinkedIn Lead Gen Forms
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { getFormResponse, LiFormResponse } from './api'

export interface ParsedLead {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  city?: string
}

export interface LeadProcessingResult {
  success: boolean
  contactId?: string
  dealId?: string
  error?: string
}

function parseLeadAnswers(answers: LiFormResponse['answers']): ParsedLead {
  const lead: ParsedLead = {}

  for (const item of answers) {
    const value = item.answer?.trim()
    if (!value) continue

    switch (item.questionType) {
      case 'FIRST_NAME':
        lead.firstName = value
        break
      case 'LAST_NAME':
        lead.lastName = value
        break
      case 'EMAIL':
        lead.email = value
        break
      case 'PHONE':
        lead.phone = value.replace(/\D/g, '')
        break
      case 'COMPANY':
        lead.company = value
        break
      case 'JOB_TITLE':
        lead.jobTitle = value
        break
      case 'CITY':
        lead.city = value
        break
    }
  }

  return lead
}

async function getOrCreateLinkedInContact(
  organizationId: string,
  responseId: string,
  lead: ParsedLead
) {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'Lead LinkedIn'
  const phone = lead.phone || `linkedin:${responseId}`

  // Tenta buscar por email se existir
  if (lead.email) {
    const byEmail = await prisma.contact.findFirst({
      where: { organizationId, email: lead.email },
    })
    if (byEmail) {
      return prisma.contact.update({
        where: { id: byEmail.id },
        data: {
          name: name || byEmail.name,
          lastInteractionAt: new Date(),
          metadata: {
            ...(byEmail.metadata as Record<string, unknown> || {}),
            source: 'linkedin',
            company: lead.company,
            jobTitle: lead.jobTitle,
            city: lead.city,
            linkedInFormResponseId: responseId,
          },
        },
      })
    }
  }

  // Tenta buscar por telefone
  const byPhone = await prisma.contact.findUnique({
    where: { organizationId_phone: { organizationId, phone } },
  })
  if (byPhone) {
    return prisma.contact.update({
      where: { id: byPhone.id },
      data: {
        name: name || byPhone.name,
        email: lead.email || byPhone.email,
        lastInteractionAt: new Date(),
        metadata: {
          ...(byPhone.metadata as Record<string, unknown> || {}),
          source: 'linkedin',
          company: lead.company,
          jobTitle: lead.jobTitle,
          city: lead.city,
          linkedInFormResponseId: responseId,
        },
      },
    })
  }

  // Cria novo contato
  return prisma.contact.create({
    data: {
      organizationId,
      phone,
      name: name || null,
      email: lead.email || null,
      status: 'ACTIVE',
      tags: [],
      leadScore: 0,
      lastInteractionAt: new Date(),
      metadata: {
        source: 'linkedin',
        company: lead.company,
        jobTitle: lead.jobTitle,
        city: lead.city,
        linkedInFormResponseId: responseId,
      },
    },
  })
}

async function ensureLinkedInTag(organizationId: string, contactId: string) {
  const tagName = 'LINKEDIN'
  let tag = await prisma.tag.findFirst({
    where: { organizationId, name: tagName },
  })

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        organizationId,
        name: tagName,
        color: '#0A66C2',
        source: 'linkedin',
      },
    })
  }

  const existing = await prisma.contactTag.findUnique({
    where: { contactId_tagId: { contactId, tagId: tag.id } },
  })

  if (!existing) {
    await prisma.contactTag.create({
      data: { contactId, tagId: tag.id, assignedBy: null },
    })

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tags: true },
    })
    if (contact && !contact.tags.includes(tagName)) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { tags: { push: tagName } },
      })
    }
  }

  return tag
}

async function ensureLinkedInList(organizationId: string, contactId: string) {
  const listName = 'LINKEDIN'
  let list = await prisma.list.findFirst({
    where: { organizationId, name: listName },
  })

  if (!list) {
    list = await prisma.list.create({
      data: {
        organizationId,
        name: listName,
        description: 'Leads capturados via LinkedIn Lead Gen Forms',
        color: '#0A66C2',
        isDynamic: false,
        contactCount: 0,
      },
    })
  }

  const existing = await prisma.listContact.findUnique({
    where: { listId_contactId: { listId: list.id, contactId } },
  })

  if (!existing) {
    await prisma.listContact.create({
      data: { listId: list.id, contactId, addedBy: null },
    })
    await prisma.list.update({
      where: { id: list.id },
      data: { contactCount: { increment: 1 } },
    })
  }

  return list
}

async function createLinkedInDeal(
  organizationId: string,
  contactId: string,
  pipelineId: string,
  productId: string,
  leadName: string
): Promise<string | null> {
  try {
    const initialStage = await prisma.pipelineStage.findFirst({
      where: { pipelineId },
      orderBy: { position: 'asc' },
    })

    if (!initialStage) {
      console.warn('[LinkedIn Lead] Nenhum stage encontrado para pipeline', pipelineId)
      return null
    }

    const deal = await prisma.deal.create({
      data: {
        organizationId,
        productId,
        pipelineId,
        contactId,
        stageId: initialStage.id,
        title: `Lead ${leadName}`,
        status: 'OPEN',
        value: 0,
        currency: 'BRL',
        priority: 'MEDIUM',
        createdBy: 'system',
        source: 'linkedin',
        channel: 'LINKEDIN',
      },
    })

    await prisma.dealActivity.create({
      data: {
        dealId: deal.id,
        user_id: 'system',
        type: 'DEAL_CREATED',
        description: 'Negócio criado automaticamente via LinkedIn Lead Gen Form',
        metadata: { source: 'linkedin' },
      },
    })

    return deal.id
  } catch (error) {
    console.error('[LinkedIn Lead] Erro ao criar deal:', error)
    return null
  }
}

export async function processLinkedInLead(
  organizationId: string,
  responseId: string
): Promise<LeadProcessingResult> {
  try {
    const integration = await prisma.linkedInIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration || integration.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Integração não encontrada ou não ativa',
      }
    }

    // Verifica se o formulário está na seleção (se houver seleção)
    const accessToken = decrypt(integration.accessToken)
    const formResponse = await getFormResponse(accessToken, responseId)

    if (!formResponse) {
      return {
        success: false,
        error: 'Não foi possível buscar detalhes da resposta do formulário',
      }
    }

    if (
      integration.selectedFormIds.length > 0 &&
      !integration.selectedFormIds.includes(formResponse.leadGenerationForm)
    ) {
      return {
        success: false,
        error: 'Formulário não está na lista de formulários selecionados',
      }
    }

    const lead = parseLeadAnswers(formResponse.answers)
    const contact = await getOrCreateLinkedInContact(organizationId, responseId, lead)

    // Tag e Lista LINKEDIN
    await ensureLinkedInTag(organizationId, contact.id)
    await ensureLinkedInList(organizationId, contact.id)

    // Deal
    let dealId: string | null = null
    const pipelineId = integration.pipelineId
    const productId = integration.productId

    if (pipelineId && productId) {
      const leadName = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'LinkedIn'
      dealId = await createLinkedInDeal(
        organizationId,
        contact.id,
        pipelineId,
        productId,
        leadName
      )
    }

    // Atualiza estatísticas da integração
    await prisma.linkedInIntegration.update({
      where: { organizationId },
      data: {
        totalLeads: { increment: 1 },
        lastLeadAt: new Date(),
      },
    })

    return {
      success: true,
      contactId: contact.id,
      dealId: dealId || undefined,
    }
  } catch (error) {
    console.error('[LinkedIn Lead] Erro no processamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    }
  }
}
