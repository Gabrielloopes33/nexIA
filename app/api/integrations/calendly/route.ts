/**
 * API de Integração com Calendly
 * GET    - Retorna a integração atual da organização
 * POST   - Salva o token, busca dados do usuário e registra o webhook
 * DELETE - Desconecta: deleta o webhook no Calendly e remove o registro
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Helpers Calendly API ─────────────────────────────────────────────────────

async function calendlyGet(path: string, token: string) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Calendly API ${path}: ${res.status} ${err}`)
  }
  return res.json()
}

async function calendlyDelete(path: string, token: string) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  // 204 No Content é sucesso
  if (!res.ok && res.status !== 204) {
    const err = await res.text()
    throw new Error(`Calendly DELETE ${path}: ${res.status} ${err}`)
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ success: false, error: 'organizationId obrigatório' }, { status: 400 })
  }

  const integration = await prisma.calendlyIntegration.findUnique({
    where: { organizationId },
    select: {
      id: true,
      organizationId: true,
      calendlyUserName: true,
      calendlyUserEmail: true,
      webhookSubscriptionUri: true,
      status: true,
      totalBookings: true,
      lastBookingAt: true,
      createdAt: true,
      updatedAt: true,
      // Não retorna accessToken nem signingKey por segurança
    },
  })

  return NextResponse.json({ success: true, data: integration })
}

// ─── POST — conectar / reconectar ─────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { organizationId, accessToken } = body

    if (!organizationId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'organizationId e accessToken são obrigatórios' },
        { status: 400 }
      )
    }

    // 1. Busca dados do usuário no Calendly
    const meData = await calendlyGet('/users/me', accessToken)
    const user = meData.resource
    const userUri: string = user.uri
    const orgUri: string = user.current_organization

    // 2. Remove webhook anterior se existir
    const existing = await prisma.calendlyIntegration.findUnique({
      where: { organizationId },
      select: { webhookSubscriptionUri: true, accessToken: true },
    })

    if (existing?.webhookSubscriptionUri) {
      try {
        // Extrai o path do URI: https://api.calendly.com/webhook_subscriptions/{uuid}
        const uriPath = new URL(existing.webhookSubscriptionUri).pathname
        await calendlyDelete(uriPath, existing.accessToken)
      } catch (e) {
        // Ignora erros ao deletar webhook antigo (pode já ter sido removido)
        console.warn('[Calendly] Não foi possível deletar webhook antigo:', e)
      }
    }

    // 3. Registra novo webhook no Calendly
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
    if (!appUrl) {
      return NextResponse.json(
        { success: false, error: 'NEXT_PUBLIC_APP_URL não configurado no .env' },
        { status: 500 }
      )
    }

    const webhookUrl = `${appUrl}/api/webhooks/calendly?organizationId=${organizationId}`

    const webhookRes = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['invitee.created', 'invitee.canceled'],
        organization: orgUri,
        scope: 'organization',
      }),
    })

    if (!webhookRes.ok) {
      const errText = await webhookRes.text()
      console.error('[Calendly] Erro ao registrar webhook:', errText)
      return NextResponse.json(
        { success: false, error: `Erro ao registrar webhook no Calendly: ${webhookRes.status}` },
        { status: 400 }
      )
    }

    const webhookData = await webhookRes.json()
    const webhook = webhookData.resource
    const signingKey: string = webhook.signing_key
    const webhookSubscriptionUri: string = webhook.uri

    // 4. Salva/atualiza no banco
    const integration = await prisma.calendlyIntegration.upsert({
      where: { organizationId },
      create: {
        organizationId,
        accessToken,
        calendlyUserUri: userUri,
        calendlyOrganizationUri: orgUri,
        calendlyUserName: user.name,
        calendlyUserEmail: user.email,
        webhookSubscriptionUri,
        signingKey,
        status: 'ACTIVE',
      },
      update: {
        accessToken,
        calendlyUserUri: userUri,
        calendlyOrganizationUri: orgUri,
        calendlyUserName: user.name,
        calendlyUserEmail: user.email,
        webhookSubscriptionUri,
        signingKey,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: integration.id,
        organizationId: integration.organizationId,
        calendlyUserName: integration.calendlyUserName,
        calendlyUserEmail: integration.calendlyUserEmail,
        webhookSubscriptionUri: integration.webhookSubscriptionUri,
        status: integration.status,
        totalBookings: integration.totalBookings,
        lastBookingAt: integration.lastBookingAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Calendly] Erro ao conectar:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ─── DELETE — desconectar ─────────────────────────────────────────────────────

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'organizationId obrigatório' }, { status: 400 })
    }

    const integration = await prisma.calendlyIntegration.findUnique({
      where: { organizationId },
    })

    if (!integration) {
      return NextResponse.json({ success: true, message: 'Nenhuma integração para remover' })
    }

    // Remove webhook no Calendly
    if (integration.webhookSubscriptionUri) {
      try {
        const uriPath = new URL(integration.webhookSubscriptionUri).pathname
        await calendlyDelete(uriPath, integration.accessToken)
      } catch (e) {
        console.warn('[Calendly] Não foi possível deletar webhook no Calendly:', e)
      }
    }

    // Remove do banco
    await prisma.calendlyIntegration.delete({ where: { organizationId } })

    return NextResponse.json({ success: true, message: 'Integração desconectada com sucesso' })
  } catch (error) {
    console.error('[Calendly] Erro ao desconectar:', error)
    return NextResponse.json({ success: false, error: 'Erro ao desconectar' }, { status: 500 })
  }
}
