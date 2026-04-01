/**
 * /api/integrations/linkedin
 *
 * GET    — retorna configuração atual da integração
 * PATCH  — atualiza adAccountId, selectedFormIds, pipelineId, productId
 * DELETE — desconecta (marca como DISCONNECTED)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'
import { decrypt } from '@/lib/crypto'
import {
  registerWebhookSubscription,
  deleteWebhookSubscription,
} from '@/lib/linkedin/api'

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

    const integration = await prisma.linkedInIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    // Não expõe tokens na resposta
    const { accessToken: _, refreshToken: __, ...safe } = integration

    return NextResponse.json({ success: true, data: safe })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
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

    const { adAccountId, adAccountName, selectedFormIds, pipelineId, productId } = body

    const updated = await prisma.linkedInIntegration.update({
      where: { organizationId },
      data: {
        ...(adAccountId !== undefined && { adAccountId }),
        ...(adAccountName !== undefined && { adAccountName }),
        ...(selectedFormIds !== undefined && { selectedFormIds }),
        ...(pipelineId !== undefined && { pipelineId }),
        ...(productId !== undefined && { productId }),
        status: 'CONFIGURED',
      },
    })

    const { accessToken: _, refreshToken: __, ...safe } = updated
    return NextResponse.json({ success: true, data: safe })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
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

    const integration = await prisma.linkedInIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration) {
      return NextResponse.json({ success: true })
    }

    // Remove assinatura do webhook no LinkedIn se existir
    if (integration.webhookSubscriptionId) {
      try {
        const accessToken = decrypt(integration.accessToken)
        await deleteWebhookSubscription(accessToken, integration.webhookSubscriptionId)
      } catch (err) {
        console.warn('[LinkedIn] Falha ao remover webhook subscription:', err)
      }
    }

    await prisma.linkedInIntegration.update({
      where: { organizationId },
      data: {
        status: 'DISCONNECTED',
        webhookSubscriptionId: null,
        accessToken: '',
        refreshToken: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Erro ao desconectar' }, { status: 500 })
  }
}

/**
 * POST /api/integrations/linkedin — registra o webhook no LinkedIn para ativar a integração
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json().catch(() => ({}))
    const organizationId = body.organizationId || user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    const integration = await prisma.linkedInIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration || integration.status === 'DISCONNECTED') {
      return NextResponse.json(
        { success: false, error: 'Integração não encontrada ou desconectada' },
        { status: 404 }
      )
    }

    if (!integration.adAccountId) {
      return NextResponse.json(
        { success: false, error: 'Configure uma conta de anúncios antes de ativar' },
        { status: 400 }
      )
    }

    const accessToken = decrypt(integration.accessToken)
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/linkedin`

    const subscriptionId = await registerWebhookSubscription(
      accessToken,
      integration.adAccountId,
      webhookUrl
    )

    await prisma.linkedInIntegration.update({
      where: { organizationId },
      data: {
        webhookSubscriptionId: subscriptionId,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      data: { subscriptionId, status: 'ACTIVE' },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('[LinkedIn] Erro ao ativar webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ativar integração',
      },
      { status: 500 }
    )
  }
}
