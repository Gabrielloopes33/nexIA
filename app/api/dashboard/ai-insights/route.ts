import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/ai-insights
 * Retorna insights de IA baseados nos dados
 * Query params: organizationId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Buscar insights gerados pela IA
    const aiInsights = await prisma.aiInsight.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Gerar insights dinâmicos baseados nos dados
    const dynamicInsights = await generateDynamicInsights(organizationId, thirtyDaysAgo, sevenDaysAgo, now)

    // Combinar insights da IA com insights dinâmicos
    const allInsights = [
      ...aiInsights.map(insight => ({
        id: insight.id,
        type: mapInsightType(insight.type),
        title: insight.title,
        description: insight.description,
        priority: insight.confidence && insight.confidence > 0.9 ? 'high' : 
                  insight.confidence && insight.confidence > 0.7 ? 'medium' : 'low',
        action: insight.action || 'Ver detalhes',
        actionUrl: insight.actionUrl,
        category: insight.category,
        confidence: insight.confidence,
        value: insight.value,
        relatedContactIds: insight.relatedContactIds,
        relatedDealIds: insight.relatedDealIds,
        createdAt: insight.createdAt,
        expiresAt: insight.expiresAt,
        source: 'ai'
      })),
      ...dynamicInsights
    ]

    // Ordenar por prioridade e limitar
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const sortedInsights = allInsights
      .sort((a, b) => {
        const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
                            (priorityOrder[b.priority as keyof typeof priorityOrder] || 1)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        total: sortedInsights.length,
        insights: sortedInsights
      }
    })
  } catch (error) {
    console.error('[Dashboard AI Insights] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar insights' },
      { status: 500 }
    )
  }
}

/**
 * Mapeia o tipo do insight do Prisma para o formato da API
 */
function mapInsightType(type: string): string {
  const typeMap: Record<string, string> = {
    'PREDICTION': 'prediction',
    'ALERT': 'alert',
    'RECOMMENDATION': 'recommendation',
    'DISCOVERY': 'discovery'
  }
  return typeMap[type] || 'insight'
}

/**
 * Gera insights dinâmicos baseados nos dados do sistema
 */
async function generateDynamicInsights(
  organizationId: string, 
  thirtyDaysAgo: Date, 
  sevenDaysAgo: Date, 
  now: Date
): Promise<Array<{
  id: string
  type: string
  title: string
  description: string
  priority: string
  action: string
  category: string
  createdAt: Date
  source: string
  [key: string]: any
}>> {
  const insights: Array<{
    id: string
    type: string
    title: string
    description: string
    priority: string
    action: string
    category: string
    createdAt: Date
    source: string
    [key: string]: any
  }> = []

  // 1. Pipeline Insights - Deals parados há muito tempo
  const staleDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'OPEN',
      updatedAt: { lt: thirtyDaysAgo }
    },
    include: { contact: true, stage: true },
    take: 5
  })

  if (staleDeals.length > 0) {
    insights.push({
      id: `stale-deals-${now.getTime()}`,
      type: 'alert',
      title: 'Deals inativos detectados',
      description: `${staleDeals.length} oportunidades não têm atualização há mais de 30 dias. Considere fazer follow-up ou movê-las para outra etapa.`,
      priority: staleDeals.length > 5 ? 'high' : 'medium',
      action: 'Ver deals inativos',
      category: 'pipeline',
      createdAt: now,
      source: 'dynamic',
      relatedDealIds: staleDeals.map(d => d.id),
      metadata: { staleDealCount: staleDeals.length }
    })
  }

  // 2. Revenue Insights - Comparação com mês anterior
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  const currentMonthDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'WON',
      actualCloseDate: { gte: currentMonthStart }
    },
    select: { amount: true }
  })

  const lastMonthDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'WON',
      actualCloseDate: { gte: lastMonthStart, lt: currentMonthStart }
    },
    select: { amount: true }
  })

  const currentRevenue = currentMonthDeals.reduce((sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0)
  const lastRevenue = lastMonthDeals.reduce((sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0)

  if (lastRevenue > 0) {
    const growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100
    if (growth > 20) {
      insights.push({
        id: `revenue-growth-${now.getTime()}`,
        type: 'discovery',
        title: 'Crescimento de receita! 🎉',
        description: `Sua receita este mês está ${growth.toFixed(1)}% acima do mês anterior. Continue assim!`,
        priority: 'medium',
        action: 'Ver relatório de vendas',
        category: 'revenue',
        createdAt: now,
        source: 'dynamic',
        metadata: { growthPercentage: growth }
      })
    } else if (growth < -20) {
      insights.push({
        id: `revenue-decline-${now.getTime()}`,
        type: 'alert',
        title: 'Queda na receita detectada',
        description: `Sua receita este mês está ${Math.abs(growth).toFixed(1)}% abaixo do mês anterior. É hora de revisar suas estratégias.`,
        priority: 'high',
        action: 'Analisar pipeline',
        category: 'revenue',
        createdAt: now,
        source: 'dynamic',
        metadata: { declinePercentage: growth }
      })
    }
  }

  // 3. Contact Insights - Novos contatos
  const newContacts = await prisma.contact.count({
    where: {
      organizationId,
      deletedAt: null,
      createdAt: { gte: sevenDaysAgo }
    }
  })

  if (newContacts > 10) {
    insights.push({
      id: `new-contacts-${now.getTime()}`,
      type: 'discovery',
      title: 'Boom de novos contatos! 📈',
      description: `${newContacts} novos contatos foram adicionados na última semana. Aproveite para qualificá-los.`,
      priority: 'medium',
      action: 'Qualificar contatos',
      category: 'contacts',
      createdAt: now,
      source: 'dynamic',
      metadata: { newContactCount: newContacts }
    })
  }

  // 4. Conversation Insights - Mensagens não respondidas
  const unreadConversations = await prisma.conversation.count({
    where: {
      organizationId,
      status: 'ACTIVE',
      lastMessageAt: { gte: sevenDaysAgo },
      messages: {
        some: {
          direction: 'INBOUND',
          status: { not: 'READ' }
        }
      }
    }
  })

  if (unreadConversations > 5) {
    insights.push({
      id: `unread-messages-${now.getTime()}`,
      type: 'alert',
      title: 'Mensagens pendentes de resposta',
      description: `Você tem ${unreadConversations} conversas com mensagens não lidas dos últimos 7 dias.`,
      priority: unreadConversations > 10 ? 'high' : 'medium',
      action: 'Ver conversas',
      category: 'conversations',
      createdAt: now,
      source: 'dynamic',
      metadata: { unreadCount: unreadConversations }
    })
  }

  // 5. Win Rate Insight
  const dealsClosedThisMonth = await prisma.deal.count({
    where: {
      organizationId,
      status: { in: ['WON', 'LOST'] },
      actualCloseDate: { gte: currentMonthStart }
    }
  })

  const dealsWonThisMonth = await prisma.deal.count({
    where: {
      organizationId,
      status: 'WON',
      actualCloseDate: { gte: currentMonthStart }
    }
  })

  if (dealsClosedThisMonth >= 5) {
    const winRate = (dealsWonThisMonth / dealsClosedThisMonth) * 100
    if (winRate > 50) {
      insights.push({
        id: `win-rate-${now.getTime()}`,
        type: 'discovery',
        title: 'Excelente taxa de conversão! 🎯',
        description: `Você fechou ${dealsWonThisMonth} de ${dealsClosedThisMonth} deals este mês (${winRate.toFixed(1)}% de win rate).`,
        priority: 'low',
        action: 'Ver deals fechados',
        category: 'pipeline',
        createdAt: now,
        source: 'dynamic',
        metadata: { winRate, dealsWon: dealsWonThisMonth, dealsClosed: dealsClosedThisMonth }
      })
    } else if (winRate < 30) {
      insights.push({
        id: `low-win-rate-${now.getTime()}`,
        type: 'recommendation',
        title: 'Taxa de conversão baixa',
        description: `Sua taxa de fechamento está em ${winRate.toFixed(1)}%. Considere revisar seu processo de qualificação.`,
        priority: 'medium',
        action: 'Melhorar qualificação',
        category: 'pipeline',
        createdAt: now,
        source: 'dynamic',
        metadata: { winRate, dealsWon: dealsWonThisMonth, dealsClosed: dealsClosedThisMonth }
      })
    }
  }

  // 6. High Value Deals Alert
  const highValueDeals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: 'OPEN',
      amount: { gte: 10000 }
    },
    orderBy: { amount: 'desc' },
    take: 3,
    include: { contact: true }
  })

  if (highValueDeals.length > 0) {
    const totalValue = highValueDeals.reduce((sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0)
    insights.push({
      id: `high-value-${now.getTime()}`,
      type: 'recommendation',
      title: 'Deals de alto valor em aberto',
      description: `Você tem ${highValueDeals.length} oportunidades de alto valor (R$ ${(totalValue / 1000).toFixed(0)}k total) aguardando fechamento.`,
      priority: 'high',
      action: 'Priorizar deals',
      category: 'pipeline',
      createdAt: now,
      source: 'dynamic',
      relatedDealIds: highValueDeals.map(d => d.id),
      metadata: { highValueCount: highValueDeals.length, totalValue }
    })
  }

  // 7. Subscription/Churn Insight
  const activeSubscriptions = await prisma.subscription.count({
    where: { organizationId, status: 'active' }
  })

  const canceledThisMonth = await prisma.subscription.count({
    where: {
      organizationId,
      status: 'canceled',
      canceledAt: { gte: currentMonthStart }
    }
  })

  if (canceledThisMonth > 0) {
    const churnRate = activeSubscriptions > 0 ? (canceledThisMonth / (activeSubscriptions + canceledThisMonth)) * 100 : 0
    if (churnRate > 10) {
      insights.push({
        id: `churn-alert-${now.getTime()}`,
        type: 'alert',
        title: 'Churn elevado este mês',
        description: `${canceledThisMonth} assinaturas foram canceladas este mês (${churnRate.toFixed(1)}% de churn).`,
        priority: 'high',
        action: 'Analisar cancelamentos',
        category: 'subscriptions',
        createdAt: now,
        source: 'dynamic',
        metadata: { churnRate, canceledCount: canceledThisMonth }
      })
    }
  }

  return insights
}

/**
 * POST /api/dashboard/ai-insights
 * Cria um novo insight de IA
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, type, category, title, description, value, confidence, action, actionUrl, metadata } = body

    if (!organizationId || !type || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'organizationId, type, title e description são obrigatórios' },
        { status: 400 }
      )
    }

    const insight = await prisma.aiInsight.create({
      data: {
        organizationId,
        type,
        category,
        title,
        description,
        value,
        confidence: confidence || 0.85,
        action,
        actionUrl,
        metadata,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      data: insight
    })
  } catch (error) {
    console.error('[Dashboard AI Insights] Erro ao criar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar insight' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/dashboard/ai-insights
 * Atualiza status de um insight (dismiss, archive)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id e status são obrigatórios' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    
    if (status === 'DISMISSED') {
      updateData.dismissedAt = new Date()
    }

    const insight = await prisma.aiInsight.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: insight
    })
  } catch (error) {
    console.error('[Dashboard AI Insights] Erro ao atualizar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atualizar insight' },
      { status: 500 }
    )
  }
}
