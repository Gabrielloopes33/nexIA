import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { encrypt } from '@/lib/crypto'

const prismaAny = prisma as any

function safeIntegrationPayload(integration: {
  id: string
  organizationId: string
  webhookSecret: string | null
  selectedFlowIds: string[]
  fieldMapping: unknown
  status: string
  totalResponses: number
  lastResponseAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return {
    id: integration.id,
    organizationId: integration.organizationId,
    webhookUrl: `${appUrl}/api/webhooks/typebot?organizationId=${integration.organizationId}`,
    webhookSecret: integration.webhookSecret,
    selectedFlowIds: integration.selectedFlowIds,
    fieldMapping: integration.fieldMapping,
    status: integration.status,
    totalResponses: integration.totalResponses,
    lastResponseAt: integration.lastResponseAt,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }
}

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
    })

    return NextResponse.json({
      success: true,
      data: integration ? safeIntegrationPayload(integration) : null,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json(
      { success: false, error: 'Erro ao carregar integração Typebot' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()

    const organizationId = body.organizationId || user.organizationId
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : ''
    const selectedFlowIds = Array.isArray(body.selectedFlowIds)
      ? body.selectedFlowIds.filter((item: unknown) => typeof item === 'string' && item.trim())
      : []
    const fieldMapping = typeof body.fieldMapping === 'object' && body.fieldMapping !== null
      ? body.fieldMapping
      : null

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    const webhookSecret = crypto.randomBytes(24).toString('hex')

    const createData: Record<string, unknown> = {
      organizationId,
      webhookSecret,
      selectedFlowIds,
      fieldMapping,
      status: 'ACTIVE',
    }

    const updateData: Record<string, unknown> = {
      selectedFlowIds,
      fieldMapping,
      status: 'ACTIVE',
    }

    if (apiKey) {
      createData.apiKey = encrypt(apiKey)
      updateData.apiKey = encrypt(apiKey)
    }

    const integration = await prismaAny.typebotIntegration.upsert({
      where: { organizationId },
      create: createData,
      update: updateData,
    })

    return NextResponse.json({
      success: true,
      data: safeIntegrationPayload(integration),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    console.error('[Typebot Integration] Erro no POST:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar integração Typebot' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()

    const organizationId = body.organizationId || user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    const current = await prismaAny.typebotIntegration.findUnique({
      where: { organizationId },
    })

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Integração Typebot não encontrada' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}

    if (typeof body.status === 'string' && body.status.trim()) {
      data.status = body.status.trim().toUpperCase()
    }

    if (Array.isArray(body.selectedFlowIds)) {
      data.selectedFlowIds = body.selectedFlowIds.filter(
        (item: unknown) => typeof item === 'string' && item.trim()
      )
    }

    if (typeof body.fieldMapping === 'object' && body.fieldMapping !== null) {
      data.fieldMapping = body.fieldMapping
    }

    if (typeof body.apiKey === 'string' && body.apiKey.trim()) {
      data.apiKey = encrypt(body.apiKey.trim())
    }

    const updated = await prismaAny.typebotIntegration.update({
      where: { organizationId },
      data,
    })

    return NextResponse.json({ success: true, data: safeIntegrationPayload(updated) })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    console.error('[Typebot Integration] Erro no PATCH:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar integração Typebot' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    await prismaAny.typebotIntegration.deleteMany({
      where: { organizationId },
    })

    return NextResponse.json({
      success: true,
      message: 'Integração Typebot desconectada com sucesso',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    console.error('[Typebot Integration] Erro no DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao desconectar integração Typebot' },
      { status: 500 }
    )
  }
}
