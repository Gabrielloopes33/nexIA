import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const prismaAny = prisma as any

interface TypebotLeadData {
  name?: string
  email?: string
  phone?: string
  flowId?: string
  flowName?: string
  resultId?: string
  answers?: Record<string, unknown>
}

export interface TypebotProcessingResult {
  success: boolean
  contactId?: string
  created?: boolean
  error?: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizePhone(value?: string): string | undefined {
  if (!value) return undefined
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 ? digits : undefined
}

function syntheticPhone(email?: string, resultId?: string): string {
  const input = `${email || 'unknown'}:${resultId || Date.now().toString()}`
  const hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 16)
  return `typebot:${hash}`
}

function extractMappedFields(answers?: Record<string, unknown>): Record<string, string> {
  if (!answers) return {}

  const mapped: Record<string, string> = {}
  const aliases: Record<string, string[]> = {
    cargo: ['cargo', 'profissao', 'funcao'],
    colaboradores: ['colaboradores', 'numero_colaboradores', 'qtd_colaboradores'],
    responsavel: ['responsavel', 'responsavel_empresa'],
    estagio: ['estagio', 'estágio', 'fase'],
    preocupacao: ['preocupacao', 'preocupação'],
    afastamento: ['afastamento'],
    levantamento: ['levantamento'],
    decisao: ['decisao', 'decisão'],
    problema: ['problema'],
    duvida: ['duvida', 'dúvida'],
  }

  const normalizedEntries = Object.entries(answers).map(([key, value]) => [normalizeText(key), value] as const)

  for (const [target, keys] of Object.entries(aliases)) {
    const match = normalizedEntries.find(([normalizedKey]) => keys.some((key) => normalizedKey.includes(normalizeText(key))))
    if (match?.[1] != null && String(match[1]).trim()) {
      mapped[target] = String(match[1]).trim()
    }
  }

  return mapped
}

async function ensureTypebotTag(organizationId: string, contactId: string): Promise<void> {
  const tagName = 'TYPEBOT'

  let tag = await prisma.tag.findFirst({ where: { organizationId, name: tagName } })

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        organizationId,
        name: tagName,
        color: '#46347F',
        source: 'typebot',
      },
    })
  }

  const existing = await prisma.contactTag.findUnique({
    where: { contactId_tagId: { contactId, tagId: tag.id } },
  })

  if (!existing) {
    await prisma.contactTag.create({
      data: {
        contactId,
        tagId: tag.id,
        assignedBy: null,
      },
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
}

async function ensureTypebotList(organizationId: string, contactId: string): Promise<void> {
  const listName = 'TYPEBOT'

  let list = await prisma.list.findFirst({ where: { organizationId, name: listName } })

  if (!list) {
    list = await prisma.list.create({
      data: {
        organizationId,
        name: listName,
        description: 'Contatos capturados via Typebot',
        color: '#46347F',
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
      data: {
        listId: list.id,
        contactId,
        addedBy: null,
      },
    })

    await prisma.list.update({
      where: { id: list.id },
      data: { contactCount: { increment: 1 } },
    })
  }
}

export async function processTypebotLead(
  organizationId: string,
  leadData: TypebotLeadData
): Promise<TypebotProcessingResult> {
  try {
    const normalizedPhone = normalizePhone(leadData.phone)
    const phone = normalizedPhone || syntheticPhone(leadData.email, leadData.resultId)
    const now = new Date()

    let contact = null as Awaited<ReturnType<typeof prisma.contact.findFirst>>
    let created = false

    if (leadData.email) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId,
          email: leadData.email.toLowerCase(),
        },
      })
    }

    if (!contact && normalizedPhone) {
      contact = await prisma.contact.findUnique({
        where: {
          organizationId_phone: {
            organizationId,
            phone: normalizedPhone,
          },
        },
      })
    }

    const typebotMetadata = {
      ...extractMappedFields(leadData.answers),
      flowId: leadData.flowId,
      flowName: leadData.flowName,
      resultId: leadData.resultId,
      capturedAt: now.toISOString(),
    }

    if (contact) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: leadData.name || contact.name,
          email: leadData.email?.toLowerCase() || contact.email,
          phone: normalizedPhone || contact.phone,
          lastInteractionAt: now,
          metadata: {
            ...((contact.metadata as Record<string, unknown>) || {}),
            source: 'typebot',
            typebot: {
              ...((((contact.metadata as Record<string, unknown>)?.typebot as Record<string, unknown>) || {})),
              ...typebotMetadata,
            },
          },
        },
      })
    } else {
      created = true
      contact = await prisma.contact.create({
        data: {
          organizationId,
          phone,
          name: leadData.name || null,
          email: leadData.email?.toLowerCase() || null,
          status: 'ACTIVE',
          tags: [],
          leadScore: 0,
          lastInteractionAt: now,
          metadata: {
            source: 'typebot',
            typebot: typebotMetadata,
          },
        },
      })
    }

    await ensureTypebotTag(organizationId, contact.id)
    await ensureTypebotList(organizationId, contact.id)

    await prismaAny.typebotIntegration.updateMany({
      where: { organizationId },
      data: {
        totalResponses: { increment: 1 },
        lastResponseAt: now,
      },
    })

    return {
      success: true,
      contactId: contact.id,
      created,
    }
  } catch (error) {
    console.error('[Typebot] Erro ao processar lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno no processamento',
    }
  }
}
