#!/usr/bin/env tsx

import { createHash } from 'crypto'
import {
  ActivityType,
  ChannelType,
  DealStatus,
  PrismaClient,
} from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_SOURCE = 'dashboard_demo_print'
const DEFAULT_ORG_SLUG = 'nexia-principal'

type LostReasonValue = 'NO_BUDGET' | 'NO_INTEREST' | 'COMPETITOR' | 'NO_RESPONSE' | 'TIMING' | 'OTHER'

function uuidFromSeed(seed: string): string {
  const hash = createHash('md5').update(seed).digest('hex')
  const a = hash.slice(0, 8)
  const b = hash.slice(8, 12)
  const c = `4${hash.slice(13, 16)}`
  const dNibble = (parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8
  const d = `${dNibble.toString(16)}${hash.slice(17, 20)}`
  const e = hash.slice(20, 32)
  return `${a}-${b}-${c}-${d}-${e}`
}

function parseArgs() {
  const args = process.argv.slice(2)
  const getArgValue = (key: string) => {
    const index = args.indexOf(key)
    if (index >= 0 && args[index + 1]) return args[index + 1]
    return undefined
  }

  return {
    orgSlug: getArgValue('--slug') || DEFAULT_ORG_SLUG,
    orgId: getArgValue('--org-id'),
  }
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function clampDate(date: Date): Date {
  const now = new Date()
  if (date > now) return now
  return date
}

type StageMap = {
  novo: string
  qualificado: string
  proposta: string
  negociacao: string
  ganho: string
  perdido: string
}

async function ensurePipelineStages(organizationId: string): Promise<StageMap> {
  const definitions = [
    { key: 'novo', name: 'Novo Lead', position: 0, probability: 10, isClosed: false, color: '#64748b' },
    { key: 'qualificado', name: 'Qualificado', position: 1, probability: 25, isClosed: false, color: '#2563eb' },
    { key: 'proposta', name: 'Proposta Enviada', position: 2, probability: 50, isClosed: false, color: '#7c3aed' },
    { key: 'negociacao', name: 'Negociação', position: 3, probability: 75, isClosed: false, color: '#ea580c' },
    { key: 'ganho', name: 'Fechado Ganho', position: 4, probability: 100, isClosed: true, color: '#16a34a' },
    { key: 'perdido', name: 'Fechado Perdido', position: 5, probability: 0, isClosed: true, color: '#dc2626' },
  ] as const

  const map = {} as StageMap

  for (const def of definitions) {
    const id = uuidFromSeed(`${organizationId}:${DEMO_SOURCE}:stage:${def.key}`)
    await prisma.pipelineStage.upsert({
      where: { id },
      update: {
        name: def.name,
        position: def.position,
        probability: def.probability,
        isClosed: def.isClosed,
        isDefault: def.position === 0,
        color: def.color,
      },
      create: {
        id,
        organizationId,
        name: def.name,
        position: def.position,
        probability: def.probability,
        isClosed: def.isClosed,
        isDefault: def.position === 0,
        color: def.color,
      },
    })

    map[def.key] = id
  }

  return map
}

async function ensureMonthlyGoals(organizationId: string): Promise<void> {
  const now = new Date()

  for (let i = 0; i < 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    await prisma.monthlyGoal.upsert({
      where: {
        organizationId_year_month: {
          organizationId,
          year,
          month,
        },
      },
      update: {
        revenueGoal: 120000,
        dealsGoal: 18,
        leadsGoal: 90,
        conversionGoal: 20,
        active: true,
      },
      create: {
        organizationId,
        year,
        month,
        revenueGoal: 120000,
        dealsGoal: 18,
        leadsGoal: 90,
        conversionGoal: 20,
        active: true,
      },
    })
  }
}

async function ensureContacts(organizationId: string) {
  const contacts = [] as Array<{ id: string; phone: string; name: string | null }>

  for (let i = 1; i <= 24; i++) {
    const phone = `55119888${String(1000 + i).padStart(4, '0')}`
    const id = uuidFromSeed(`${organizationId}:${DEMO_SOURCE}:contact:${phone}`)
    const name = `Lead Demo ${String(i).padStart(2, '0')}`

    const contact = await prisma.contact.upsert({
      where: {
        organizationId_phone: {
          organizationId,
          phone,
        },
      },
      update: {
        name,
        leadScore: 35 + (i % 50),
      },
      create: {
        id,
        organizationId,
        phone,
        name,
        leadScore: 35 + (i % 50),
      },
      select: { id: true, phone: true, name: true },
    })

    contacts.push(contact)
  }

  return contacts
}

type DealInput = {
  key: string
  title: string
  status: DealStatus
  channel: ChannelType
  stageId: string
  contactId: string
  createdAt: Date
  updatedAt: Date
  value: number
  amount: number
  qualifiedAt?: Date | null
  proposalSentAt?: Date | null
  negotiationAt?: Date | null
  closedWonAt?: Date | null
  closedLostAt?: Date | null
  lostReason?: LostReasonValue | null
  leadScore: number
}

async function upsertDeal(
  organizationId: string,
  createdBy: string,
  input: DealInput
): Promise<string> {
  const id = uuidFromSeed(`${organizationId}:${DEMO_SOURCE}:deal:${input.key}`)

  await prisma.deal.upsert({
    where: { id },
    update: {
      title: input.title,
      status: input.status,
      channel: input.channel,
      stageId: input.stageId,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      value: input.value,
      amount: input.amount,
      qualifiedAt: input.qualifiedAt || null,
      proposalSentAt: input.proposalSentAt || null,
      negotiationAt: input.negotiationAt || null,
      closedWonAt: input.closedWonAt || null,
      closedLostAt: input.closedLostAt || null,
      lostReason: input.lostReason || null,
      source: DEMO_SOURCE,
      sourceId: input.key,
      leadScore: input.leadScore,
      priority: 'MEDIUM',
      currency: 'BRL',
      tags: ['dashboard-demo', 'print-ready'],
    },
    create: {
      id,
      organizationId,
      contactId: input.contactId,
      stageId: input.stageId,
      title: input.title,
      status: input.status,
      channel: input.channel,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      createdBy,
      value: input.value,
      amount: input.amount,
      qualifiedAt: input.qualifiedAt || null,
      proposalSentAt: input.proposalSentAt || null,
      negotiationAt: input.negotiationAt || null,
      closedWonAt: input.closedWonAt || null,
      closedLostAt: input.closedLostAt || null,
      lostReason: input.lostReason || null,
      source: DEMO_SOURCE,
      sourceId: input.key,
      leadScore: input.leadScore,
      priority: 'MEDIUM',
      currency: 'BRL',
      tags: ['dashboard-demo', 'print-ready'],
      probability: input.status === 'WON' ? 100 : input.status === 'LOST' ? 0 : 65,
    },
  })

  return id
}

async function upsertStageHistory(
  organizationId: string,
  dealId: string,
  dealKey: string,
  entries: Array<{ stage: string; enteredAt: Date; exitedAt: Date | null }>
): Promise<void> {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const id = uuidFromSeed(`${organizationId}:${DEMO_SOURCE}:history:${dealKey}:${i}`)
    const duration = e.exitedAt
      ? Math.max(1, Math.round((e.exitedAt.getTime() - e.enteredAt.getTime()) / (1000 * 60 * 60)))
      : null

    await prisma.pipelineStageHistory.upsert({
      where: { id },
      update: {
        dealId,
        stage: e.stage,
        enteredAt: e.enteredAt,
        exitedAt: e.exitedAt,
        duration,
      },
      create: {
        id,
        dealId,
        stage: e.stage,
        enteredAt: e.enteredAt,
        exitedAt: e.exitedAt,
        duration,
      },
    })
  }
}

async function upsertDealActivities(
  organizationId: string,
  dealId: string,
  dealKey: string,
  userId: string,
  createdAtList: Date[]
): Promise<void> {
  for (let i = 0; i < createdAtList.length; i++) {
    const id = uuidFromSeed(`${organizationId}:${DEMO_SOURCE}:activity:${dealKey}:${i}`)
    const createdAt = createdAtList[i]

    await prisma.dealActivity.upsert({
      where: { id },
      update: {
        dealId,
        user_id: userId,
        type: ActivityType.NOTE,
        description: `Atividade demo ${i + 1} (${DEMO_SOURCE})`,
        createdAt,
      },
      create: {
        id,
        dealId,
        user_id: userId,
        type: ActivityType.NOTE,
        description: `Atividade demo ${i + 1} (${DEMO_SOURCE})`,
        createdAt,
      },
    })
  }
}

async function createDashboardDeals(
  organizationId: string,
  userId: string,
  stages: StageMap,
  contacts: Array<{ id: string; phone: string; name: string | null }>
) {
  const now = new Date()

  let won = 0
  let lost = 0
  let open = 0

  const wonChannels = [
    ChannelType.WHATSAPP_OFFICIAL,
    ChannelType.INSTAGRAM,
    ChannelType.MANUAL,
    ChannelType.EMAIL,
  ]

  const wonDealsPlan = [3, 8, 11, 14, 17, 20, 23, 26, 28, 29, 30, 30]

  for (let i = 0; i < wonDealsPlan.length; i++) {
    const closedDays = wonDealsPlan[i]
    const closedWonAt = clampDate(daysAgo(closedDays))
    const createdAt = daysAgo(Math.min(30, closedDays + 8))
    const qualifiedAt = daysAgo(Math.min(30, closedDays + 6))
    const proposalSentAt = daysAgo(Math.min(30, closedDays + 4))
    const negotiationAt = daysAgo(Math.min(30, closedDays + 2))
    const amount = 4500 + i * 1100
    const contact = contacts[i % contacts.length]
    const key = `won-${i + 1}`

    const dealId = await upsertDeal(organizationId, userId, {
      key,
      title: `Demo Won ${String(i + 1).padStart(2, '0')}`,
      status: DealStatus.WON,
      channel: wonChannels[i % wonChannels.length],
      stageId: stages.ganho,
      contactId: contact.id,
      createdAt,
      updatedAt: closedWonAt,
      value: amount,
      amount,
      qualifiedAt,
      proposalSentAt,
      negotiationAt,
      closedWonAt,
      leadScore: 70 + (i % 20),
    })

    await upsertStageHistory(organizationId, dealId, key, [
      { stage: 'NEW', enteredAt: createdAt, exitedAt: qualifiedAt },
      { stage: 'QUALIFIED', enteredAt: qualifiedAt, exitedAt: proposalSentAt },
      { stage: 'PROPOSAL', enteredAt: proposalSentAt, exitedAt: negotiationAt },
      { stage: 'NEGOTIATION', enteredAt: negotiationAt, exitedAt: closedWonAt },
      { stage: 'CLOSED_WON', enteredAt: closedWonAt, exitedAt: closedWonAt },
    ])

    await upsertDealActivities(organizationId, dealId, key, userId, [daysAgo(Math.max(1, closedDays - 1))])
    won += 1
  }

  const recentLostReasons: LostReasonValue[] = [
    'NO_BUDGET',
    'COMPETITOR',
    'TIMING',
    'NO_RESPONSE',
    'NO_INTEREST',
    'OTHER',
    'TIMING',
    'NO_BUDGET',
  ]

  for (let i = 0; i < recentLostReasons.length; i++) {
    const closeDays = 2 + i * 3
    const closedLostAt = clampDate(daysAgo(closeDays))
    const createdAt = daysAgo(Math.min(30, closeDays + 12))
    const qualifiedAt = daysAgo(Math.min(30, closeDays + 8))
    const proposalSentAt = daysAgo(Math.min(30, closeDays + 5))
    const negotiationAt = daysAgo(Math.min(30, closeDays + 2))
    const amount = 6000 + i * 1300
    const contact = contacts[(i + 8) % contacts.length]
    const key = `lost-recent-${i + 1}`

    const dealId = await upsertDeal(organizationId, userId, {
      key,
      title: `Demo Lost ${String(i + 1).padStart(2, '0')}`,
      status: DealStatus.LOST,
      channel: wonChannels[i % wonChannels.length],
      stageId: stages.perdido,
      contactId: contact.id,
      createdAt,
      updatedAt: closedLostAt,
      value: amount,
      amount,
      qualifiedAt,
      proposalSentAt,
      negotiationAt,
      closedLostAt,
      lostReason: recentLostReasons[i],
      leadScore: 50 + (i % 30),
    })

    await upsertStageHistory(organizationId, dealId, key, [
      { stage: 'NEW', enteredAt: createdAt, exitedAt: qualifiedAt },
      { stage: 'QUALIFIED', enteredAt: qualifiedAt, exitedAt: proposalSentAt },
      { stage: 'PROPOSAL', enteredAt: proposalSentAt, exitedAt: negotiationAt },
      { stage: 'NEGOTIATION', enteredAt: negotiationAt, exitedAt: closedLostAt },
    ])

    await upsertDealActivities(organizationId, dealId, key, userId, [daysAgo(Math.max(1, closeDays - 1))])
    lost += 1
  }

  const previousPeriodLost = [
    { days: 35, reason: 'NO_BUDGET' as LostReasonValue },
    { days: 41, reason: 'COMPETITOR' as LostReasonValue },
    { days: 47, reason: 'TIMING' as LostReasonValue },
    { days: 53, reason: 'NO_RESPONSE' as LostReasonValue },
  ]

  for (let i = 0; i < previousPeriodLost.length; i++) {
    const p = previousPeriodLost[i]
    const closedLostAt = daysAgo(p.days)
    const createdAt = daysAgo(p.days + 10)
    const amount = 5500 + i * 900
    const contact = contacts[(i + 16) % contacts.length]
    const key = `lost-prev-${i + 1}`

    const dealId = await upsertDeal(organizationId, userId, {
      key,
      title: `Demo Lost Prev ${String(i + 1).padStart(2, '0')}`,
      status: DealStatus.LOST,
      channel: wonChannels[(i + 1) % wonChannels.length],
      stageId: stages.perdido,
      contactId: contact.id,
      createdAt,
      updatedAt: closedLostAt,
      value: amount,
      amount,
      qualifiedAt: daysAgo(p.days + 8),
      proposalSentAt: daysAgo(p.days + 5),
      negotiationAt: daysAgo(p.days + 2),
      closedLostAt,
      lostReason: p.reason,
      leadScore: 45 + i,
    })

    await upsertStageHistory(organizationId, dealId, key, [
      { stage: 'NEW', enteredAt: createdAt, exitedAt: daysAgo(p.days + 8) },
      { stage: 'QUALIFIED', enteredAt: daysAgo(p.days + 8), exitedAt: daysAgo(p.days + 5) },
      { stage: 'PROPOSAL', enteredAt: daysAgo(p.days + 5), exitedAt: daysAgo(p.days + 2) },
      { stage: 'NEGOTIATION', enteredAt: daysAgo(p.days + 2), exitedAt: closedLostAt },
    ])

    lost += 1
  }

  const openPlan = [
    { key: 'open-1', createdDays: 4, updatedDays: 1, stage: 'negociacao', progress: 3, channel: ChannelType.WHATSAPP_OFFICIAL, amount: 9000 },
    { key: 'open-2', createdDays: 6, updatedDays: 2, stage: 'proposta', progress: 2, channel: ChannelType.INSTAGRAM, amount: 7500 },
    { key: 'open-3', createdDays: 9, updatedDays: 3, stage: 'qualificado', progress: 1, channel: ChannelType.MANUAL, amount: 6800 },
    { key: 'open-4', createdDays: 12, updatedDays: 9, stage: 'negociacao', progress: 3, channel: ChannelType.EMAIL, amount: 11200 },
    { key: 'open-5', createdDays: 14, updatedDays: 10, stage: 'proposta', progress: 2, channel: ChannelType.WHATSAPP_OFFICIAL, amount: 10400 },
    { key: 'open-6', createdDays: 16, updatedDays: 11, stage: 'qualificado', progress: 1, channel: ChannelType.INSTAGRAM, amount: 7900 },
    { key: 'open-7', createdDays: 18, updatedDays: 12, stage: 'novo', progress: 0, channel: ChannelType.MANUAL, amount: 5200 },
    { key: 'open-8', createdDays: 21, updatedDays: 13, stage: 'negociacao', progress: 3, channel: ChannelType.EMAIL, amount: 9800 },
    { key: 'open-9', createdDays: 24, updatedDays: 5, stage: 'proposta', progress: 2, channel: ChannelType.WHATSAPP_OFFICIAL, amount: 8700 },
    { key: 'open-10', createdDays: 27, updatedDays: 4, stage: 'qualificado', progress: 1, channel: ChannelType.INSTAGRAM, amount: 7300 },
  ] as const

  for (let i = 0; i < openPlan.length; i++) {
    const p = openPlan[i]
    const createdAt = daysAgo(p.createdDays)
    const updatedAt = daysAgo(p.updatedDays)
    const contact = contacts[(i + 4) % contacts.length]

    const qualifiedAt = p.progress >= 1 ? daysAgo(Math.max(1, p.createdDays - 2)) : null
    const proposalSentAt = p.progress >= 2 ? daysAgo(Math.max(1, p.createdDays - 1)) : null
    const negotiationAt = p.progress >= 3 ? daysAgo(Math.max(1, p.createdDays - 0)) : null

    const stageId =
      p.stage === 'negociacao'
        ? stages.negociacao
        : p.stage === 'proposta'
          ? stages.proposta
          : p.stage === 'qualificado'
            ? stages.qualificado
            : stages.novo

    const dealId = await upsertDeal(organizationId, userId, {
      key: p.key,
      title: `Demo Open ${String(i + 1).padStart(2, '0')}`,
      status: DealStatus.OPEN,
      channel: p.channel,
      stageId,
      contactId: contact.id,
      createdAt,
      updatedAt,
      value: p.amount,
      amount: p.amount,
      qualifiedAt,
      proposalSentAt,
      negotiationAt,
      leadScore: 40 + i * 3,
    })

    const historyEntries = [{ stage: 'NEW', enteredAt: createdAt, exitedAt: qualifiedAt }]

    if (qualifiedAt) {
      historyEntries.push({ stage: 'QUALIFIED', enteredAt: qualifiedAt, exitedAt: proposalSentAt })
    }
    if (proposalSentAt) {
      historyEntries.push({ stage: 'PROPOSAL', enteredAt: proposalSentAt, exitedAt: negotiationAt })
    }
    if (negotiationAt) {
      historyEntries.push({ stage: 'NEGOTIATION', enteredAt: negotiationAt, exitedAt: null })
    }

    await upsertStageHistory(organizationId, dealId, p.key, historyEntries)

    const activities = [] as Date[]
    if (p.updatedDays <= 7) {
      activities.push(daysAgo(Math.max(1, p.updatedDays - 1)))
      activities.push(daysAgo(Math.max(1, p.updatedDays)))
    } else if (p.updatedDays <= 10) {
      activities.push(daysAgo(6))
    }

    await upsertDealActivities(organizationId, dealId, p.key, userId, activities)
    open += 1
  }

  const seededCount = await prisma.deal.count({
    where: {
      organizationId,
      source: DEMO_SOURCE,
    },
  })

  return {
    won,
    lost,
    open,
    totalDemoDeals: seededCount,
    generatedAt: now.toISOString(),
  }
}

async function resolveOrganizationAndUser(orgIdArg?: string, orgSlugArg?: string) {
  let organization = null as null | { id: string; name: string; slug: string }

  if (orgIdArg) {
    organization = await prisma.organization.findUnique({
      where: { id: orgIdArg },
      select: { id: true, name: true, slug: true },
    })
  } else {
    organization = await prisma.organization.findUnique({
      where: { slug: orgSlugArg || DEFAULT_ORG_SLUG },
      select: { id: true, name: true, slug: true },
    })
  }

  if (!organization) {
    throw new Error(`Organização não encontrada (slug=${orgSlugArg || DEFAULT_ORG_SLUG})`)
  }

  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId: organization.id,
      userId: { not: null },
      status: 'ACTIVE',
    },
    select: { userId: true },
    orderBy: { createdAt: 'asc' },
  })

  const fallbackUser = await prisma.user.findFirst({
    where: {
      organizationId: organization.id,
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  const userId = member?.userId || fallbackUser?.id
  if (!userId) {
    throw new Error('Nenhum usuário encontrado para usar como created_by nos deals dessa organização')
  }

  return { organization, userId }
}

async function main() {
  const { orgId, orgSlug } = parseArgs()

  console.log('Iniciando seed de dashboard para print...')
  console.log(`Organização alvo: ${orgId || orgSlug}`)

  const { organization, userId } = await resolveOrganizationAndUser(orgId, orgSlug)

  console.log(`Org resolvida: ${organization.name} (${organization.slug})`)
  console.log(`Usuário para created_by: ${userId}`)

  const stages = await ensurePipelineStages(organization.id)
  await ensureMonthlyGoals(organization.id)
  const contacts = await ensureContacts(organization.id)
  const summary = await createDashboardDeals(organization.id, userId, stages, contacts)

  console.log('Seed concluído com sucesso')
  console.log(`Deals demo WON: ${summary.won}`)
  console.log(`Deals demo LOST: ${summary.lost}`)
  console.log(`Deals demo OPEN: ${summary.open}`)
  console.log(`Total deals demo atuais: ${summary.totalDemoDeals}`)
  console.log(`Gerado em: ${summary.generatedAt}`)
}

main()
  .catch((error) => {
    console.error('Erro no seed de dashboard:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
