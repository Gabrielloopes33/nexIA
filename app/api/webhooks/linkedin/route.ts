/**
 * Webhook do LinkedIn Lead Gen Forms
 * GET  - Verificação de webhook (challenge)
 * POST - Recebe notificações de novos leads
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processLinkedInLead } from '@/lib/linkedin/lead-processor'

/**
 * GET /api/webhooks/linkedin?challenge=xxx
 * LinkedIn envia challenge para validar o callbackUrl
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')

  if (challenge) {
    console.log('[LinkedIn Webhook] Challenge recebido:', challenge)
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ status: 'ok', service: 'linkedin-webhook' })
}

interface LinkedInWebhookEvent {
  event?: string
  leadGenerationFormResponse?: string | { id?: string }
  account?: string
  owner?: string
  form?: string | { id?: string }
}

interface LinkedInWebhookPayload {
  event?: LinkedInWebhookEvent
  events?: LinkedInWebhookEvent[]
  leadGenerationFormResponse?: string | { id?: string }
  account?: string
  owner?: string
}

/**
 * POST /api/webhooks/linkedin
 * Recebe notificações de novos leads do LinkedIn
 */
export async function POST(request: NextRequest) {
  try {
    const payload: LinkedInWebhookPayload = await request.json()
    console.log('[LinkedIn Webhook] Payload recebido:', JSON.stringify(payload))

    const events: LinkedInWebhookEvent[] = []

    if (payload.events && Array.isArray(payload.events)) {
      events.push(...payload.events)
    } else if (payload.event) {
      events.push(payload.event)
    } else if (
      payload.leadGenerationFormResponse ||
      payload.account ||
      payload.owner
    ) {
      events.push(payload as LinkedInWebhookEvent)
    }

    if (events.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum evento processado' })
    }

    const results: Array<{ responseId: string; success: boolean; error?: string }> = []

    for (const event of events) {
      const eventType = event.event || 'LEAD_GEN_FORM_RESPONSE'

      if (eventType !== 'LEAD_GEN_FORM_RESPONSE') {
        continue
      }

      const rawResponseId =
        (typeof event.leadGenerationFormResponse === 'string'
          ? event.leadGenerationFormResponse
          : event.leadGenerationFormResponse?.id) ||
        (typeof payload.leadGenerationFormResponse === 'string'
          ? payload.leadGenerationFormResponse
          : payload.leadGenerationFormResponse?.id)

      if (!rawResponseId) {
        console.warn('[LinkedIn Webhook] Evento sem responseId:', event)
        continue
      }

      const responseId = rawResponseId.startsWith('urn:')
        ? rawResponseId.split(':').pop()!
        : rawResponseId

      const accountUrn = event.account || event.owner || payload.account || payload.owner

      // Busca integração ativa correspondente à conta de anúncios
      const integrations = await prisma.linkedInIntegration.findMany({
        where: { status: 'ACTIVE' },
      })

      const matchingIntegrations = accountUrn
        ? integrations.filter((i) => {
            const acc = i.adAccountId || ''
            return accountUrn.includes(acc) || acc.includes(accountUrn)
          })
        : integrations

      if (matchingIntegrations.length === 0) {
        console.warn('[LinkedIn Webhook] Nenhuma integração ativa encontrada para', accountUrn)
        results.push({ responseId, success: false, error: 'Integração não encontrada' })
        continue
      }

      for (const integration of matchingIntegrations) {
        const result = await processLinkedInLead(integration.organizationId, responseId)
        results.push({
          responseId,
          success: result.success,
          error: result.error,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('[LinkedIn Webhook] Erro ao processar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
