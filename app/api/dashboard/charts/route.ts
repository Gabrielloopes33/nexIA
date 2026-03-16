import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/charts
 * Retorna dados para gráficos
 * Query params: organizationId, chartType ('revenue', 'deals', 'conversations', 'contacts')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const chartType = searchParams.get('chartType') || 'revenue'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar chartType
    const validChartTypes = ['revenue', 'deals', 'conversations', 'contacts', 'pipeline']
    if (!validChartTypes.includes(chartType)) {
      return NextResponse.json(
        { success: false, error: 'chartType inválido. Use: revenue, deals, conversations, contacts ou pipeline' },
        { status: 400 }
      )
    }

    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let data: Array<{ label: string; value: number; date: string; [key: string]: any }> = []

    switch (chartType) {
      case 'revenue':
        data = await getRevenueChartData(organizationId, twelveMonthsAgo, now)
        break
      case 'deals':
        data = await getDealsChartData(organizationId, twelveMonthsAgo, now)
        break
      case 'conversations':
        data = await getConversationsChartData(organizationId, thirtyDaysAgo, now)
        break
      case 'contacts':
        data = await getContactsChartData(organizationId, twelveMonthsAgo, now)
        break
      case 'pipeline':
        data = await getPipelineChartData(organizationId)
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        chartType,
        period: chartType === 'conversations' ? '30d' : '12m',
        points: data
      }
    })
  } catch (error) {
    console.error('[Dashboard Charts] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar dados do gráfico' },
      { status: 500 }
    )
  }
}

/**
 * Gera dados de receita dos últimos 12 meses
 */
async function getRevenueChartData(organizationId: string, startDate: Date, endDate: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: 'paid',
      paidAt: { gte: startDate, lte: endDate }
    },
    select: { amountCents: true, paidAt: true }
  })

  // Agrupar por mês
  const monthlyData = new Map<string, number>()
  
  // Inicializar últimos 12 meses com 0
  for (let i = 11; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7) // YYYY-MM
    monthlyData.set(key, 0)
  }

  // Somar valores
  invoices.forEach(inv => {
    if (inv.paidAt) {
      const key = inv.paidAt.toISOString().slice(0, 7)
      const current = monthlyData.get(key) || 0
      monthlyData.set(key, current + inv.amountCents / 100)
    }
  })

  // Converter para array ordenado
  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({
      label: formatMonthLabel(month),
      value: Math.round(value * 100) / 100,
      date: `${month}-01`,
      month
    }))
}

/**
 * Gera dados de deals dos últimos 12 meses
 */
async function getDealsChartData(organizationId: string, startDate: Date, endDate: Date) {
  const deals = await prisma.deal.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { 
      amount: true, 
      createdAt: true,
      status: true
    }
  })

  // Agrupar por mês
  const monthlyData = new Map<string, { created: number; value: number; won: number; lost: number }>()
  
  // Inicializar últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    monthlyData.set(key, { created: 0, value: 0, won: 0, lost: 0 })
  }

  // Agrupar dados
  deals.forEach(deal => {
    const key = deal.createdAt.toISOString().slice(0, 7)
    const current = monthlyData.get(key) || { created: 0, value: 0, won: 0, lost: 0 }
    
    current.created++
    current.value += deal.amount ? Number(deal.amount) : 0
    
    if (deal.status === 'WON') current.won++
    if (deal.status === 'LOST') current.lost++
    
    monthlyData.set(key, current)
  })

  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, stats]) => ({
      label: formatMonthLabel(month),
      value: stats.created,
      date: `${month}-01`,
      month,
      dealValue: Math.round(stats.value * 100) / 100,
      won: stats.won,
      lost: stats.lost
    }))
}

/**
 * Gera dados de conversas dos últimos 30 dias
 */
async function getConversationsChartData(organizationId: string, startDate: Date, endDate: Date) {
  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { createdAt: true, messageCount: true }
  })

  const messages = await prisma.message.findMany({
    where: {
      conversation: { organizationId },
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { createdAt: true, direction: true }
  })

  // Agrupar por dia
  const dailyData = new Map<string, { conversations: number; messages: number; inbound: number; outbound: number }>()
  
  // Inicializar últimos 30 dias
  for (let i = 29; i >= 0; i--) {
    const d = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    dailyData.set(key, { conversations: 0, messages: 0, inbound: 0, outbound: 0 })
  }

  // Contar conversas
  conversations.forEach(conv => {
    const key = conv.createdAt.toISOString().slice(0, 10)
    const current = dailyData.get(key)
    if (current) {
      current.conversations++
    }
  })

  // Contar mensagens
  messages.forEach(msg => {
    const key = msg.createdAt.toISOString().slice(0, 10)
    const current = dailyData.get(key)
    if (current) {
      current.messages++
      if (msg.direction === 'INBOUND') current.inbound++
      if (msg.direction === 'OUTBOUND') current.outbound++
    }
  })

  return Array.from(dailyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, stats]) => ({
      label: formatDayLabel(date),
      value: stats.conversations,
      date,
      conversations: stats.conversations,
      messages: stats.messages,
      inbound: stats.inbound,
      outbound: stats.outbound
    }))
}

/**
 * Gera dados de contatos dos últimos 12 meses
 */
async function getContactsChartData(organizationId: string, startDate: Date, endDate: Date) {
  const contacts = await prisma.contact.findMany({
    where: {
      organizationId,
      deletedAt: null,
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { createdAt: true }
  })

  // Agrupar por mês
  const monthlyData = new Map<string, number>()
  
  // Inicializar últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    monthlyData.set(key, 0)
  }

  // Contar contatos
  contacts.forEach(contact => {
    const key = contact.createdAt.toISOString().slice(0, 7)
    const current = monthlyData.get(key) || 0
    monthlyData.set(key, current + 1)
  })

  // Calcular acumulado
  let accumulated = await prisma.contact.count({
    where: {
      organizationId,
      deletedAt: null,
      createdAt: { lt: startDate }
    }
  })

  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, newContacts]) => {
      accumulated += newContacts
      return {
        label: formatMonthLabel(month),
        value: newContacts,
        accumulated,
        date: `${month}-01`,
        month,
        newContacts
      }
    })
}

/**
 * Gera dados do pipeline por estágio
 */
async function getPipelineChartData(organizationId: string) {
  const stages = await prisma.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
      probability: true
    }
  })

  const dealsByStage = await prisma.deal.groupBy({
    by: ['stageId'],
    where: {
      organizationId,
      status: 'OPEN'
    },
    _count: { id: true },
    _sum: { amount: true }
  })

  const stageMap = new Map(dealsByStage.map(d => [d.stageId, d]))

  return stages.map(stage => {
    const stats = stageMap.get(stage.id)
    return {
      label: stage.name,
      value: stats?._count.id || 0,
      date: new Date().toISOString(),
      stageId: stage.id,
      color: stage.color,
      position: stage.position,
      probability: stage.probability,
      dealCount: stats?._count.id || 0,
      dealValue: stats?._sum.amount ? Number(stats._sum.amount) : 0
    }
  })
}

/**
 * Formata label de mês (YYYY-MM -> Mmm/YY)
 */
function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(monthNum) - 1]}/${year.slice(2)}`
}

/**
 * Formata label de dia (YYYY-MM-DD -> DD/MM)
 */
function formatDayLabel(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}`
}
