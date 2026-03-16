/**
 * Script de Seed para Dashboard Metrics
 * 
 * Popula o banco de dados com dados de exemplo para testar
 * as métricas do dashboard em ambiente de desenvolvimento.
 * 
 * Uso: npx tsx scripts/seed-dashboard-metrics.ts [organizationId]
 */

import { PrismaClient, DealStatus, LostReason, RecoveryPotential, ChannelType } from '@prisma/client'
import { subDays, subWeeks, subMonths, startOfWeek, addDays, addHours } from 'date-fns'

const prisma = new PrismaClient()

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  dealsCount: 200,
  contactsCount: 150,
  conversationsCount: 300,
  messagesPerConversation: { min: 3, max: 15 },
  stages: [
    { name: 'Novo', position: 0, probability: 10 },
    { name: 'Qualificado', position: 1, probability: 25 },
    { name: 'Proposta', position: 2, probability: 50 },
    { name: 'Negociação', position: 3, probability: 75 },
    { name: 'Fechado', position: 4, probability: 100, isClosed: true },
  ],
  lostReasons: [
    LostReason.PRICE,
    LostReason.COMPETITOR,
    LostReason.TIMING,
    LostReason.NO_BUDGET,
    LostReason.NO_INTEREST,
  ],
  channels: [
    ChannelType.WHATSAPP_OFFICIAL,
    ChannelType.WHATSAPP_UNOFFICIAL,
    ChannelType.INSTAGRAM,
    ChannelType.MANUAL,
  ],
}

// ============================================
// HELPERS
// ============================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(): number {
  // Valores entre R$ 1.000 e R$ 50.000
  return randomInt(10, 500) * 100
}

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedPipelineStages(organizationId: string) {
  console.log('🏗️ Criando etapas do pipeline...')

  const stages = []
  for (const stageConfig of CONFIG.stages) {
    const stage = await prisma.pipelineStage.upsert({
      where: {
        id: `stage-${stageConfig.position}-${organizationId}`,
      },
      update: {},
      create: {
        id: `stage-${stageConfig.position}-${organizationId}`,
        organizationId,
        name: stageConfig.name,
        position: stageConfig.position,
        color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'][stageConfig.position],
        probability: stageConfig.probability,
        isClosed: stageConfig.isClosed || false,
      },
    })
    stages.push(stage)
  }

  console.log(`✅ ${stages.length} etapas criadas`)
  return stages
}

async function seedContacts(organizationId: string) {
  console.log('👥 Criando contatos...')

  const contacts = []
  const now = new Date()

  for (let i = 0; i < CONFIG.contactsCount; i++) {
    const createdAt = randomDate(subDays(now, 90), now)
    const contact = await prisma.contact.create({
      data: {
        organizationId,
        phone: `55119${String(randomInt(10000000, 99999999))}`,
        name: `Contato ${i + 1}`,
        leadScore: randomInt(0, 100),
        createdAt,
        updatedAt: createdAt,
        lastInteractionAt: randomDate(createdAt, now),
      },
    })
    contacts.push(contact)
  }

  console.log(`✅ ${contacts.length} contatos criados`)
  return contacts
}

async function seedDeals(
  organizationId: string,
  stages: any[],
  contacts: any[]
) {
  console.log('💼 Criando deals...')

  const deals = []
  const now = new Date()

  for (let i = 0; i < CONFIG.dealsCount; i++) {
    const contact = randomItem(contacts)
    const status = randomItem<DealStatus>(['OPEN', 'WON', 'LOST', 'OPEN', 'OPEN', 'WON'])
    const stage = status === 'WON' 
      ? stages.find(s => s.isClosed) 
      : status === 'LOST'
        ? stages[randomInt(0, 3)]
        : randomItem(stages.filter(s => !s.isClosed))
    
    const channel = randomItem(CONFIG.channels)
    const createdAt = randomDate(subDays(now, 90), now)
    const amount = randomAmount()

    // Datas de progressão pelo funil
    const enteredStageAt = createdAt
    const firstContactAt = addHours(createdAt, randomInt(1, 48))
    const qualifiedAt = randomBool(0.7) ? addDays(firstContactAt, randomInt(1, 7)) : null
    const proposalAt = status !== 'OPEN' && qualifiedAt && randomBool(0.6) 
      ? addDays(qualifiedAt, randomInt(1, 14)) 
      : null
    const negotiationAt = (status === 'WON' || status === 'LOST') && proposalAt && randomBool(0.7)
      ? addDays(proposalAt, randomInt(1, 10))
      : null

    // Dados de fechamento/perda
    const actualCloseDate = status === 'WON' || status === 'LOST'
      ? randomDate(negotiationAt || proposalAt || qualifiedAt || createdAt, now)
      : null

    const lostReason = status === 'LOST' ? randomItem(CONFIG.lostReasons) : null
    const lostAt = status === 'LOST' ? actualCloseDate : null
    
    // Cálculo de potencial de recuperação
    let recoveryPotential: RecoveryPotential | null = null
    let recoveryScore: number | null = null
    
    if (status === 'LOST') {
      const daysSinceLost = Math.floor((now.getTime() - lostAt!.getTime()) / (1000 * 60 * 60 * 24))
      const score = Math.max(0, 100 - daysSinceLost * 2 + randomInt(-10, 10))
      
      if (score >= 70) recoveryPotential = RecoveryPotential.HIGH
      else if (score >= 40) recoveryPotential = RecoveryPotential.MEDIUM
      else if (score >= 20) recoveryPotential = RecoveryPotential.LOW
      else recoveryPotential = RecoveryPotential.NONE
      
      recoveryScore = score
    }

    // Follow-up tracking
    const followUpCount = randomInt(0, 10)
    const lastFollowUpAt = followUpCount > 0 
      ? randomDate(createdAt, now)
      : null
    const nextFollowUpAt = status === 'OPEN' && randomBool(0.6)
      ? addDays(now, randomInt(1, 7))
      : null

    const deal = await prisma.deal.create({
      data: {
        organizationId,
        contactId: contact.id,
        stageId: stage.id,
        title: `Oportunidade ${i + 1}`,
        description: `Descrição da oportunidade ${i + 1}`,
        amount,
        currency: 'BRL',
        leadScore: contact.leadScore,
        status,
        channel,
        createdAt,
        updatedAt: randomDate(createdAt, now),
        
        // Datas do funil
        enteredStageAt,
        firstContactAt,
        qualifiedAt,
        proposalAt,
        negotiationAt,
        actualCloseDate,
        
        // Dados de perda
        lostReason,
        lostReasonDetail: lostReason ? `Detalhes do motivo: ${lostReason}` : null,
        lostAt,
        recoveryPotential,
        recoveryScore,
        
        // Follow-up
        followUpCount,
        lastFollowUpAt,
        nextFollowUpAt,
      },
    })
    deals.push(deal)
  }

  console.log(`✅ ${deals.length} deals criados`)
  return deals
}

async function seedConversations(
  organizationId: string,
  contacts: any[],
  whatsappInstanceId: string
) {
  console.log('💬 Criando conversas...')

  const conversations = []
  const now = new Date()

  for (let i = 0; i < Math.min(CONFIG.conversationsCount, contacts.length); i++) {
    const contact = contacts[i]
    const createdAt = randomDate(subDays(now, 60), now)
    const windowStart = createdAt
    const windowEnd = addHours(windowStart, 24)

    const conversation = await prisma.conversation.create({
      data: {
        organizationId,
        instanceId: whatsappInstanceId,
        contactId: contact.id,
        conversationId: `conv-${i}-${Date.now()}`,
        type: randomBool(0.7) ? 'USER_INITIATED' : 'BUSINESS_INITIATED',
        status: windowEnd > now ? 'ACTIVE' : randomBool(0.5) ? 'EXPIRED' : 'CLOSED',
        windowStart,
        windowEnd,
        lastMessageAt: randomDate(createdAt, Math.min(now.getTime(), windowEnd.getTime())),
        messageCount: randomInt(CONFIG.messagesPerConversation.min, CONFIG.messagesPerConversation.max),
        createdAt,
        updatedAt: createdAt,
      },
    })
    conversations.push(conversation)
  }

  console.log(`✅ ${conversations.length} conversas criadas`)
  return conversations
}

async function seedMessages(
  conversations: any[]
) {
  console.log('📨 Criando mensagens...')

  let totalMessages = 0

  for (const conversation of conversations) {
    const messageCount = conversation.messageCount
    
    for (let i = 0; i < messageCount; i++) {
      const isInbound = i === 0 || randomBool(0.4) // Primeira mensagem sempre inbound
      const createdAt = addMinutes(
        conversation.createdAt,
        i * randomInt(5, 60)
      )

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          contactId: conversation.contactId,
          messageId: `msg-${conversation.id}-${i}`,
          direction: isInbound ? 'INBOUND' : 'OUTBOUND',
          type: 'TEXT',
          content: isInbound 
            ? `Olá, tenho interesse no produto ${i + 1}`
            : `Obrigado pelo contato! Como posso ajudar?`,
          status: randomItem(['SENT', 'DELIVERED', 'READ']),
          createdAt,
          metadata: {
            channel: randomItem(['whatsapp_official', 'whatsapp_unofficial', 'instagram']),
          },
        },
      })
      totalMessages++
    }
  }

  console.log(`✅ ${totalMessages} mensagens criadas`)
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

async function seedMonthlyGoals(organizationId: string) {
  console.log('🎯 Criando metas mensais...')

  const now = new Date()
  const goals = []

  // Criar metas para os últimos 3 meses e atual
  for (let i = 2; i >= 0; i--) {
    const date = subMonths(now, i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    const goal = await prisma.monthlyGoal.upsert({
      where: {
        organizationId_year_month: {
          organizationId,
          year,
          month,
        },
      },
      update: {},
      create: {
        organizationId,
        year,
        month,
        revenueGoal: 50000 + randomInt(-10000, 20000),
        dealsGoal: 20 + randomInt(-5, 10),
        leadsGoal: 100 + randomInt(-20, 30),
        conversionGoal: 25,
        active: true,
      },
    })
    goals.push(goal)
  }

  console.log(`✅ ${goals.length} metas mensais criadas`)
  return goals
}

async function seedStageHistory(
  organizationId: string,
  deals: any[],
  stages: any[]
) {
  console.log('📊 Criando histórico de estágios...')

  let historyCount = 0

  for (const deal of deals) {
    const currentStagePos = stages.find(s => s.id === deal.stageId)?.position || 0
    
    // Criar histórico para cada etapa até a atual
    for (let pos = 0; pos <= Math.min(currentStagePos, 3); pos++) {
      const stage = stages[pos]
      const enteredAt = pos === 0 
        ? deal.createdAt 
        : addDays(deal.createdAt, pos * randomInt(2, 7))
      
      const exitedAt = pos < currentStagePos && deal.status !== 'OPEN'
        ? addDays(enteredAt, randomInt(1, 14))
        : null

      const durationHours = exitedAt
        ? Math.floor((exitedAt.getTime() - enteredAt.getTime()) / (1000 * 60 * 60))
        : null

      await prisma.pipelineStageHistory.create({
        data: {
          dealId: deal.id,
          stageId: stage.id,
          organizationId,
          enteredAt,
          exitedAt,
          durationHours,
          amount: deal.amount,
          leadScore: deal.leadScore,
        },
      })
      historyCount++
    }
  }

  console.log(`✅ ${historyCount} registros de histórico criados`)
}

async function seedWhatsAppInstance(organizationId: string) {
  console.log('📱 Verificando instância WhatsApp...')

  // Buscar ou criar uma instância
  let instance = await prisma.whatsAppInstance.findFirst({
    where: { organizationId },
  })

  if (!instance) {
    instance = await prisma.whatsAppInstance.create({
      data: {
        organizationId,
        name: 'Instância Teste',
        phoneNumber: '5511999999999',
        status: 'CONNECTED',
        channelType: 'WHATSAPP_OFFICIAL',
        connectedAt: new Date(),
        messagingTier: 1,
      },
    })
    console.log('✅ Instância WhatsApp criada')
  } else {
    console.log('✅ Instância WhatsApp existente encontrada')
  }

  return instance
}

// ============================================
// MAIN
// ============================================

async function main() {
  const organizationId = process.argv[2]

  if (!organizationId) {
    console.error('❌ Erro: organizationId é obrigatório')
    console.log('Uso: npx tsx scripts/seed-dashboard-metrics.ts <organizationId>')
    process.exit(1)
  }

  console.log('🚀 Iniciando seed de métricas do dashboard...')
  console.log(`📍 Organization ID: ${organizationId}`)

  try {
    // Verificar se organização existe
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      console.error(`❌ Erro: Organização ${organizationId} não encontrada`)
      process.exit(1)
    }

    console.log(`🏢 Organização: ${organization.name}`)

    // Limpar dados existentes (opcional - comentar se quiser manter)
    console.log('\n🧹 Limpando dados existentes...')
    await prisma.pipelineStageHistory.deleteMany({ where: { organizationId } })
    await prisma.message.deleteMany({
      where: {
        conversation: { organizationId },
      },
    })
    await prisma.conversation.deleteMany({ where: { organizationId } })
    await prisma.deal.deleteMany({ where: { organizationId } })
    await prisma.contact.deleteMany({ where: { organizationId } })
    await prisma.pipelineStage.deleteMany({ where: { organizationId } })
    await prisma.monthlyGoal.deleteMany({ where: { organizationId } })
    console.log('✅ Dados existentes removidos')

    // Criar dados
    console.log('\n🌱 Criando novos dados...\n')

    const stages = await seedPipelineStages(organizationId)
    const contacts = await seedContacts(organizationId)
    const deals = await seedDeals(organizationId, stages, contacts)
    const instance = await seedWhatsAppInstance(organizationId)
    const conversations = await seedConversations(organizationId, contacts, instance.id)
    await seedMessages(conversations)
    await seedMonthlyGoals(organizationId)
    await seedStageHistory(organizationId, deals, stages)

    console.log('\n✨ Seed completado com sucesso!')
    console.log('\n📊 Resumo:')
    console.log(`   • ${stages.length} etapas do pipeline`)
    console.log(`   • ${contacts.length} contatos`)
    console.log(`   • ${deals.length} deals`)
    console.log(`   • ${conversations.length} conversas`)

  } catch (error) {
    console.error('\n❌ Erro durante o seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
