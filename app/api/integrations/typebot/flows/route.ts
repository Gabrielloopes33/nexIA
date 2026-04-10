import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { listTypebotFlows } from '@/lib/typebot/api'

const prismaAny = prisma as any

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const organizationId =
      new URL(request.url).searchParams.get('organizationId') ||
      user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    const integration = await prismaAny.typebotIntegration.findUnique({
      where: { organizationId },
      select: { apiKey: true, selectedFlowIds: true },
    })

    if (!integration?.apiKey) {
      return NextResponse.json({
        success: true,
        data: [],
        warning: 'Conecte a integração Typebot para listar fluxos',
      })
    }

    const flows = await listTypebotFlows(integration.apiKey)

    const selected = new Set(integration.selectedFlowIds)

    return NextResponse.json({
      success: true,
      data: flows.map((flow) => ({
        ...flow,
        selected: selected.has(flow.id),
      })),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    console.error('[Typebot Integration] Erro ao listar fluxos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar fluxos do Typebot' },
      { status: 500 }
    )
  }
}
