import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processTypebotLead } from '@/lib/typebot/response-processor'

const prismaAny = prisma as any

interface TypebotWebhookPayload {
  resultId?: string
  flowId?: string
  flowName?: string
  variables?: Record<string, unknown>
  answers?: Record<string, unknown>
  data?: {
    resultId?: string
    flowId?: string
    flowName?: string
    variables?: Record<string, unknown>
    answers?: Record<string, unknown>
  }
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) return false

  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const normalizedSignature = signature.replace(/^sha256=/, '')

  try {
    return safeEqual(normalizedSignature, expected)
  } catch {
    return false
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function findValue(obj: Record<string, unknown>, candidates: string[]): string | undefined {
  const entries = Object.entries(obj)

  for (const [key, value] of entries) {
    if (value == null) continue

    const normalizedKey = key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (candidates.some((candidate) => normalizedKey.includes(candidate))) {
      const parsed = String(value).trim()
      if (parsed) return parsed
    }
  }

  return undefined
}

function parsePayload(payload: TypebotWebhookPayload) {
  const root = toRecord(payload)
  const nested = toRecord(payload.data)

  const variables = {
    ...toRecord(root.variables),
    ...toRecord(nested.variables),
  }

  const answers = {
    ...toRecord(root.answers),
    ...toRecord(nested.answers),
    ...variables,
  }

  const resultId =
    (root.resultId as string | undefined) ||
    (nested.resultId as string | undefined)

  const flowId =
    (root.flowId as string | undefined) ||
    (nested.flowId as string | undefined) ||
    (findValue(answers, ['flowid', 'flow_id']) as string | undefined)

  const flowName =
    (root.flowName as string | undefined) ||
    (nested.flowName as string | undefined)

  return {
    resultId,
    flowId,
    flowName,
    name: findValue(answers, ['nome', 'name']),
    email: findValue(answers, ['email', 'e-mail']),
    phone: findValue(answers, ['telefone', 'phone', 'whatsapp', 'celular']),
    answers,
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const payload = JSON.parse(rawBody) as TypebotWebhookPayload

    const { searchParams } = new URL(request.url)
    const organizationIdFromQuery = searchParams.get('organizationId')

    const parsed = parsePayload(payload)

    let integration: any = null

    if (organizationIdFromQuery) {
      integration = await prismaAny.typebotIntegration.findFirst({
        where: {
          organizationId: organizationIdFromQuery,
          status: 'ACTIVE',
        },
      })
    } else if (parsed.flowId) {
      integration = await prismaAny.typebotIntegration.findFirst({
        where: {
          status: 'ACTIVE',
          selectedFlowIds: { has: parsed.flowId },
        },
      })
    }

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Integração Typebot ativa não encontrada' },
        { status: 404 }
      )
    }

    if (integration.selectedFlowIds.length > 0 && parsed.flowId && !integration.selectedFlowIds.includes(parsed.flowId)) {
      return NextResponse.json(
        { success: false, error: 'Fluxo não está autorizado nesta integração' },
        { status: 400 }
      )
    }

    if (!integration.webhookSecret) {
      return NextResponse.json(
        { success: false, error: 'Webhook secret não configurado para a integração' },
        { status: 401 }
      )
    }

    const signature = request.headers.get('x-typebot-signature')
    const rawSecretHeader = request.headers.get('x-typebot-secret')

    const isValid = Boolean(
      (signature && verifySignature(rawBody, signature, integration.webhookSecret)) ||
      (rawSecretHeader && safeEqual(rawSecretHeader, integration.webhookSecret))
    )

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Assinatura inválida' },
        { status: 401 }
      )
    }

    if (!parsed.email && !parsed.phone) {
      return NextResponse.json(
        { success: false, error: 'Payload sem email/telefone para identificar contato' },
        { status: 400 }
      )
    }

    const result = await processTypebotLead(integration.organizationId, {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      flowId: parsed.flowId,
      flowName: parsed.flowName,
      resultId: parsed.resultId,
      answers: parsed.answers,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao processar lead do Typebot' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        contactId: result.contactId,
        created: result.created,
      },
    })
  } catch (error) {
    console.error('[Typebot Webhook] Erro ao processar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno no webhook Typebot' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'typebot-webhook',
    timestamp: new Date().toISOString(),
  })
}
