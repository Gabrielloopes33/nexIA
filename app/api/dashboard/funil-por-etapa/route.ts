import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import type { FunilPorEtapaData } from '@/types/dashboard'

/**
 * GET /api/dashboard/funil-por-etapa
 * 
 * Retorna a distribuição de leads por etapa do funil
 * 
 * Query Params:
 * - period: Período de análise ('7d', '30d', '90d')
 * - organizationId: (opcional) ID da organização
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authUser = await getAuthenticatedUser()

    // Parâmetros
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const organizationId = searchParams.get('organizationId')

    // Calcular date range
    const endDate = new Date()
    const startDate = new Date()
    const days = parseInt(period.replace('d', ''))
    startDate.setDate(endDate.getDate() - days)

    // Determinar organizationId
    const orgId = organizationId || authUser.organizationId

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Buscar etapas do pipeline com contagem de contatos
    const pipelineStages = await prisma.pipelineStage.findMany({
      where: { 
        organizationId: orgId,
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { 
            contacts: {
              where: {
                createdAt: { 
                  gte: startDate, 
                  lte: endDate 
                }
              }
            }
          }
        },
        contacts: {
          where: {
            createdAt: { 
              gte: startDate, 
              lte: endDate 
            }
          },
          select: {
            id: true,
            metadata: true,
          }
        }
      }
    })

    // Calcular valores totais
    const etapas = pipelineStages.map((stage) => {
      // Calcular valor total desta etapa
      const valorEtapa = stage.contacts.reduce((sum, contact) => {
        const dealValue = Number(contact.metadata?.dealValue) || 0
        return sum + dealValue
      }, 0)

      return {
        id: stage.id,
        nome: stage.name,
        quantidade: stage._count.contacts,
        valor: valorEtapa,
        cor: stage.color || '#8B7DB8',
        ordem: stage.order,
      }
    })

    // Calcular totais
    const totalLeads = etapas.reduce((sum, e) => sum + e.quantidade, 0)
    const valorTotal = etapas.reduce((sum, e) => sum + e.valor, 0)

    // Calcular taxa de conversão geral
    // Última etapa / Primeira etapa (considerando ordem)
    const primeiraEtapa = etapas[0]
    const ultimaEtapa = etapas[etapas.length - 1]
    const taxaConversaoGeral = primeiraEtapa?.quantidade > 0
      ? ((ultimaEtapa?.quantidade || 0) / primeiraEtapa.quantidade) * 100
      : 0

    const responseData: FunilPorEtapaData = {
      etapas,
      totalLeads,
      taxaConversaoGeral,
      valorTotal,
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutos cache no cliente
      },
    })

  } catch (error) {
    console.error('[API] Erro ao buscar funil por etapa:', error)

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro interno ao carregar dados do funil',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dashboard/funil-por-etapa
 * 
 * Para atualizações ou cálculos complexos
 */
export async function POST(request: NextRequest) {
  // Implementação futura para cálculos personalizados
  return NextResponse.json(
    { error: 'Método não implementado' },
    { status: 501 }
  )
}
