/**
 * Webhook do Calendly
 * POST - Recebe notificações de agendamentos criados e cancelados
 *
 * Configuração necessária:
 * - Variável de ambiente: CALENDLY_WEBHOOK_SIGNING_KEY (chave de assinatura do Calendly)
 * - URL do webhook no Calendly: https://seu-dominio.com/api/webhooks/calendly?organizationId=SEU_ORG_ID
 * - Eventos para assinar: invitee.created, invitee.canceled
 */

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Tipos do payload do Calendly ────────────────────────────────────────────

interface CalendlyLocation {
  type: string
  join_url?: string
  location?: string
}

interface CalendlyScheduledEvent {
  uri: string
  name: string
  start_time: string
  end_time: string
  status: string
  location?: CalendlyLocation
}

interface CalendlyInviteePayload {
  uri: string
  name: string
  email: string
  status: string
  scheduled_event: CalendlyScheduledEvent
  cancel_url?: string
  reschedule_url?: string
  cancellation?: {
    canceler_type: string
    reason?: string
  }
}

interface CalendlyWebhookBody {
  event: 'invitee.created' | 'invitee.canceled'
  created_at: string
  payload: CalendlyInviteePayload
}

// ─── Verificação de assinatura ────────────────────────────────────────────────

function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string,
  signingKey: string
): boolean {
  // Formato do header: "t=<timestamp>,v1=<hash>"
  const parts = signatureHeader.split(',')
  const tPart = parts.find((p) => p.startsWith('t='))
  const v1Part = parts.find((p) => p.startsWith('v1='))

  if (!tPart || !v1Part) return false

  const timestamp = tPart.substring(2)
  const receivedHash = v1Part.substring(3)

  const toSign = `${timestamp}.${rawBody}`
  const expectedHash = crypto
    .createHmac('sha256', signingKey)
    .update(toSign, 'utf8')
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    )
  } catch {
    return false
  }
}

// ─── Gera um "telefone" sintético para contatos vindos do Calendly ────────────
// O modelo Contact exige phone único por organização, mas agendamentos do
// Calendly só trazem e-mail. Usamos um prefixo + hash para garantir unicidade.

function syntheticPhone(email: string): string {
  const hash = crypto.createHash('md5').update(email).digest('hex').substring(0, 12)
  return `cal_${hash}` // max 17 chars, cabe em VarChar(50)
}

// ─── Extrai localização legível do evento ─────────────────────────────────────

function extractLocation(location?: CalendlyLocation): string | null {
  if (!location) return null
  if (location.join_url) return location.join_url
  if (location.location) return location.location
  return location.type || null
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'organizationId é obrigatório na query string' },
      { status: 400 }
    )
  }

  // Lê o corpo como texto para verificar a assinatura
  const rawBody = await request.text()

  // Verificação de assinatura (opcional em dev, obrigatória em produção)
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
  const signatureHeader = request.headers.get('Calendly-Webhook-Signature') ?? ''

  if (signingKey) {
    if (!signatureHeader) {
      console.warn('[Calendly Webhook] Header de assinatura ausente')
      return NextResponse.json(
        { success: false, error: 'Assinatura ausente' },
        { status: 401 }
      )
    }
    if (!verifyCalendlySignature(rawBody, signatureHeader, signingKey)) {
      console.warn('[Calendly Webhook] Assinatura inválida')
      return NextResponse.json(
        { success: false, error: 'Assinatura inválida' },
        { status: 401 }
      )
    }
  } else {
    console.warn('[Calendly Webhook] CALENDLY_WEBHOOK_SIGNING_KEY não configurada — assinatura não verificada')
  }

  let body: CalendlyWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Payload JSON inválido' },
      { status: 400 }
    )
  }

  const { event, payload } = body
  console.log(`[Calendly Webhook] Evento recebido: ${event} | org: ${organizationId}`)

  // Verifica se a organização existe
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) {
    console.warn(`[Calendly Webhook] Organização não encontrada: ${organizationId}`)
    return NextResponse.json(
      { success: false, error: 'Organização não encontrada' },
      { status: 404 }
    )
  }

  try {
    if (event === 'invitee.created') {
      return await handleInviteeCreated(organizationId, payload)
    }

    if (event === 'invitee.canceled') {
      return await handleInviteeCanceled(organizationId, payload)
    }

    // Outros eventos do Calendly são ignorados
    console.log(`[Calendly Webhook] Evento ignorado: ${event}`)
    return NextResponse.json({ success: true, message: 'Evento ignorado' })
  } catch (error) {
    console.error('[Calendly Webhook] Erro ao processar evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar evento' },
      { status: 500 }
    )
  }
}

// ─── invitee.created → cria agendamento no CRM ───────────────────────────────

async function handleInviteeCreated(
  organizationId: string,
  payload: CalendlyInviteePayload
): Promise<NextResponse> {
  const { name, email, scheduled_event } = payload
  const { name: eventName, start_time, end_time, location, uri: eventUri } = scheduled_event

  // 1. Encontra ou cria o contato pelo e-mail
  let contact = await prisma.contact.findFirst({
    where: { organizationId, email: email.toLowerCase() },
    select: { id: true, name: true },
  })

  if (!contact) {
    // Cria novo contato — phone sintético para satisfazer a constraint única
    const phone = syntheticPhone(email)
    contact = await prisma.contact.create({
      data: {
        organizationId,
        name: name || email,
        email: email.toLowerCase(),
        phone,
      },
      select: { id: true, name: true },
    })
    console.log(`[Calendly Webhook] Contato criado: ${contact.id} (${email})`)
  } else {
    console.log(`[Calendly Webhook] Contato encontrado: ${contact.id} (${email})`)
  }

  // 2. Cria o agendamento
  const schedule = await prisma.schedule.create({
    data: {
      organizationId,
      type: 'meeting',
      title: eventName,
      description: buildDescription(payload, eventUri),
      contactId: contact.id,
      startTime: new Date(start_time),
      endTime: new Date(end_time),
      location: extractLocation(location),
      status: 'pending',
    },
  })

  console.log(`[Calendly Webhook] Agendamento criado: ${schedule.id} — "${eventName}" em ${start_time}`)

  return NextResponse.json({
    success: true,
    message: 'Agendamento criado com sucesso',
    scheduleId: schedule.id,
    contactId: contact.id,
  })
}

// ─── invitee.canceled → cancela agendamento no CRM ──────────────────────────

async function handleInviteeCanceled(
  organizationId: string,
  payload: CalendlyInviteePayload
): Promise<NextResponse> {
  const { email, scheduled_event } = payload
  const { uri: eventUri } = scheduled_event

  // Localiza o agendamento pelo URI do evento Calendly (salvo na description)
  const schedule = await prisma.schedule.findFirst({
    where: {
      organizationId,
      status: 'pending',
      description: { contains: eventUri },
    },
  })

  if (!schedule) {
    // Pode acontecer se o agendamento foi criado antes dessa integração ou já cancelado
    console.warn(`[Calendly Webhook] Agendamento não encontrado para URI: ${eventUri} (email: ${email})`)
    return NextResponse.json({
      success: true,
      message: 'Agendamento não encontrado — nenhuma ação necessária',
    })
  }

  await prisma.schedule.update({
    where: { id: schedule.id },
    data: { status: 'cancelled' },
  })

  console.log(`[Calendly Webhook] Agendamento cancelado: ${schedule.id}`)

  return NextResponse.json({
    success: true,
    message: 'Agendamento cancelado com sucesso',
    scheduleId: schedule.id,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDescription(payload: CalendlyInviteePayload, eventUri: string): string {
  const lines: string[] = ['Agendado via Calendly']

  if (payload.name) lines.push(`Convidado: ${payload.name}`)
  if (payload.email) lines.push(`E-mail: ${payload.email}`)

  if (payload.cancellation?.reason) {
    lines.push(`Motivo do cancelamento: ${payload.cancellation.reason}`)
  }

  // URI usado para identificar o agendamento em caso de cancelamento
  lines.push(`__calendly_uri: ${eventUri}`)

  return lines.join('\n')
}
