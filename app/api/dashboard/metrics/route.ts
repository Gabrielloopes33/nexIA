import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/metrics
 * Retorna métricas consolidadas do dashboard
 * Query params: organizationId (obrigatório), period (opcional: '7d', '30d', '90d')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const period = searchParams.get('period') || '30d'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar período
    const validPeriods = ['7d', '30d', '90d']
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { success: false, error: 'Período inválido. Use: 7d, 30d ou 90d' },
        { status: 400 }
      )
    }

    // Calcular datas do período
    const days = parseInt(period.replace('d', ''))
    const now = new Date()
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // ========== CONTACTS ==========
    const totalContacts = await prisma.contact.count({
      where: { 
        organizationId, 
        deletedAt: null 
      }
    })

    const newThisMonth = await prisma.contact.count({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: monthStart }
      }
    })

    const lastMonthContacts = await prisma.contact.count({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: {
          gte: lastMonthStart,
          lt: monthStart
        }
      }
    })

    const contactsGrowth = lastMonthContacts > 0
      ? ((newThisMonth - lastMonthContacts) / lastMonthContacts) * 100
      : newThisMonth > 0 ? 100 : 0

    // ========== CONVERSATIONS ==========
    const totalConversations = await prisma.conversation.count({
      where: { organizationId }
    })

    const activeConversations = await prisma.conversation.count({
      where: {
        organizationId,
        status: 'ACTIVE',
        windowEnd: { gt: now }
      }
    })

    // Conversas não lidas (mensagens recebidas não lidas)
    const unreadMessages = await prisma.message.count({
      where: {
        conversation: { organizationId },
        direction: 'INBOUND',
        status: { not: 'READ' }
      }
    })

    // ========== PIPELINE / DEALS ==========
    const totalDeals = await prisma.deal.count({
      where: { organizationId }
    })

    const openDeals = await prisma.deal.findMany({
      where: {
        organizationId,
        status: 'OPEN'
      },
      select: { amount: true }
    })

    const wonDeals = await prisma.deal.findMany({
      where: {
        organizationId,
        status: 'WON'
      },
      select: { amount: true }
    })

    const lostDeals = await prisma.deal.count({
      where: {
        organizationId,
        status: 'LOST'
      }
    })

    const totalValue = openDeals.reduce((sum, deal) => {
      return sum + (deal.amount ? Number(deal.amount) : 0)
    }, 0)

    const wonValue = wonDeals.reduce((sum, deal) => {
      return sum + (deal.amount ? Number(deal.amount) : 0)
    }, 0)

    const avgDealValue = openDeals.length > 0 
      ? totalValue / openDeals.length 
      : 0

    const closedDeals = wonDeals.length + lostDeals
    const winRate = closedDeals > 0 
      ? (wonDeals.length / closedDeals) * 100 
      : 0

    // ========== REVENUE (baseado em invoices pagas) ==========
    const monthlyInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'paid',
        paidAt: { gte: monthStart }
      },
      select: { amountCents: true }
    })

    const lastMonthInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'paid',
        paidAt: {
          gte: lastMonthStart,
          lt: monthStart
        }
      },
      select: { amountCents: true }
    })

    const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.amountCents, 0) / 100
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.amountCents, 0) / 100

    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0

    // Assinaturas ativas (recurring revenue)
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        organizationId,
        status: 'active'
      },
      include: { plan: true }
    })

    const recurringRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.plan?.priceCents || 0)
    }, 0) / 100

    // ========== SUBSCRIPTIONS ==========
    const activeSubsCount = activeSubscriptions.length

    // Calcular churn rate (assinaturas canceladas no período / total ativo no início)
    const canceledInPeriod = await prisma.subscription.count({
      where: {
        organizationId,
        status: 'canceled',
        canceledAt: { gte: periodStart }
      }
    })

    const totalSubsInPeriod = await prisma.subscription.count({
      where: {
        organizationId,
        createdAt: { lt: periodStart }
      }
    })

    const churnRate = totalSubsInPeriod > 0
      ? (canceledInPeriod / totalSubsInPeriod) * 100
      : 0

    // ========== MÉTRICAS DO PERÍODO ==========
    const periodContacts = await prisma.contact.count({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: periodStart }
      }
    })

    const periodConversations = await prisma.conversation.count({
      where: {
        organizationId,
        createdAt: { gte: periodStart }
      }
    })

    const periodDeals = await prisma.deal.count({
      where: {
        organizationId,
        createdAt: { gte: periodStart }
      }
    })

    const periodWonDeals = await prisma.deal.findMany({
      where: {
        organizationId,
        status: 'WON',
        actualCloseDate: { gte: periodStart }
      },
      select: { amount: true }
    })

    const periodRevenue = periodWonDeals.reduce((sum, deal) => {
      return sum + (deal.amount ? Number(deal.amount) : 0)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        period,
        periodStart: periodStart.toISOString(),
        periodEnd: now.toISOString(),
        contacts: {
          total: totalContacts,
          newThisMonth,
          growth: Math.round(contactsGrowth * 100) / 100,
          periodNew: periodContacts
        },
        conversations: {
          total: totalConversations,
          active: activeConversations,
          unread: unreadMessages,
          periodNew: periodConversations
        },
        pipeline: {
          totalDeals,
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          lostDeals,
          totalValue: Math.round(totalValue * 100) / 100,
          avgDealValue: Math.round(avgDealValue * 100) / 100,
          winRate: Math.round(winRate * 100) / 100,
          wonValue: Math.round(wonValue * 100) / 100,
          periodNewDeals: periodDeals,
          periodRevenue: Math.round(periodRevenue * 100) / 100
        },
        revenue: {
          monthly: Math.round(monthlyRevenue * 100) / 100,
          recurring: Math.round(recurringRevenue * 100) / 100,
          growth: Math.round(revenueGrowth * 100) / 100,
          lastMonth: Math.round(lastMonthRevenue * 100) / 100
        },
        subscriptions: {
          active: activeSubsCount,
          churnRate: Math.round(churnRate * 100) / 100,
          canceledInPeriod
        }
      }
    })
  } catch (error) {
    console.error('[Dashboard Metrics] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar métricas' },
      { status: 500 }
    )
  }
}
