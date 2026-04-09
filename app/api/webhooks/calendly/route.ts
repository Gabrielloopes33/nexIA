/**
 * Webhook do Calendly
 * POST - Recebe notificações de agendamentos e sincroniza com o CRM
 *
 * Configuração necessária:
 * - Variável de ambiente: CALENDLY_WEBHOOK_SIGNING_KEY (chave de assinatura do Calendly)
 * - URL do webhook no Calendly: https://seu-dominio.com/api/webhooks/calendly?organizationId=SEU_ORG_ID
 * - Eventos recomendados: invitee.*, scheduled_event.*, invitee_no_show.*
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

interface CalendlyQuestionAnswer {
  question: string
  answer: string
  position: number
}

interface CalendlyInviteePayload {
  uri: string
  name: string
  email: string
  status: string
  text_reminder_number?: string
  questions_and_answers?: CalendlyQuestionAnswer[]
  scheduled_event: CalendlyScheduledEvent
  cancel_url?: string
  reschedule_url?: string
  cancellation?: {
    canceler_type: string
    reason?: string
  }
}

interface CalendlyWebhookBody {
  event: string
  created_at: string
  payload: Record<string, unknown>
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

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function getScheduledEvent(payload: Record<string, unknown>, event: string): CalendlyScheduledEvent | null {
  if (event.startsWith('scheduled_event.')) {
    const eventPayload = payload as unknown as CalendlyScheduledEvent
    if (eventPayload?.uri) return eventPayload
    return null
  }

  const scheduledEvent = asObject(payload.scheduled_event)
  if (!scheduledEvent) return null

  const uri = asString(scheduledEvent.uri)
  if (!uri) return null

  return {
    uri,
    name: asString(scheduledEvent.name) ?? 'Reunião Calendly',
    start_time: asString(scheduledEvent.start_time) ?? new Date().toISOString(),
    end_time: asString(scheduledEvent.end_time) ?? new Date().toISOString(),
    status: asString(scheduledEvent.status) ?? 'active',
    location: asObject(scheduledEvent.location) as CalendlyLocation | undefined,
  }
}

function buildCalendlyDescription(params: {
  name?: string
  email?: string
  eventUri?: string
  inviteeUri?: string
  cancellationReason?: string
  sourceEvent: string
}): string {
  const lines: string[] = ['Agendado via Calendly']

  if (params.name) lines.push(`Convidado: ${params.name}`)
  if (params.email) lines.push(`E-mail: ${params.email.toLowerCase()}`)
  lines.push(`__calendly_source_event: ${params.sourceEvent}`)
  lines.push('__calendly_provider: calendly')

  if (params.eventUri) {
    lines.push(`__calendly_event_uri: ${params.eventUri}`)
    // Compatibilidade com registros antigos
    lines.push(`__calendly_uri: ${params.eventUri}`)
  }

  if (params.inviteeUri) {
    lines.push(`__calendly_invitee_uri: ${params.inviteeUri}`)
  }

  if (params.cancellationReason) {
    lines.push(`Motivo do cancelamento: ${params.cancellationReason}`)
  }

  return lines.join('\n')
}

function eventContains(whereEventUri: string) {
  return {
    OR: [
      { description: { contains: `__calendly_event_uri: ${whereEventUri}` } },
      { description: { contains: `__calendly_uri: ${whereEventUri}` } },
    ],
  }
}

function inviteeContains(whereInviteeUri: string) {
  return { description: { contains: `__calendly_invitee_uri: ${whereInviteeUri}` } }
}

async function findScheduleByCalendlyRefs(params: {
  organizationId: string
  eventUri?: string
  inviteeUri?: string
  contactId?: string
}) {
  const orClauses: Array<Record<string, unknown>> = []

  if (params.inviteeUri) {
    orClauses.push(inviteeContains(params.inviteeUri))
  }

  if (params.eventUri) {
    if (params.contactId) {
      orClauses.push({
        AND: [eventContains(params.eventUri), { contactId: params.contactId }],
      })
    } else {
      orClauses.push(eventContains(params.eventUri))
    }
  }

  if (orClauses.length === 0) return null

  return prisma.schedule.findFirst({
    where: {
      organizationId: params.organizationId,
      OR: orClauses,
    },
    orderBy: { createdAt: 'desc' },
  })
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

  // Busca a signing key no banco (salva na ativação da integração)
  const integrationRecord = await prisma.calendlyIntegration.findUnique({
    where: { organizationId },
    select: { signingKey: true, status: true },
  })

  const signingKey = integrationRecord?.signingKey ?? process.env.CALENDLY_WEBHOOK_SIGNING_KEY
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
    console.warn('[Calendly Webhook] Signing key não encontrada — assinatura não verificada')
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
      return await handleInviteeCreated(organizationId, payload, event)
    }

    if (event === 'invitee.canceled') {
      return await handleInviteeCanceled(organizationId, payload, event)
    }

    if (event === 'scheduled_event.canceled') {
      return await handleScheduledEventCanceled(organizationId, payload)
    }

    if (event === 'scheduled_event.created') {
      return await handleScheduledEventCreated(organizationId, payload)
    }

    if (event === 'invitee_no_show.created') {
      return await handleInviteeNoShow(organizationId, payload, true)
    }

    if (event === 'invitee_no_show.deleted') {
      return await handleInviteeNoShow(organizationId, payload, false)
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

function extractPhone(payload: CalendlyInviteePayload): string | null {
  // Prioridade 1: campo nativo de lembrete por SMS
  if (payload.text_reminder_number) return payload.text_reminder_number

  // Prioridade 2: perguntas customizadas (busca por palavra-chave)
  if (payload.questions_and_answers) {
    const phoneKeywords = ['phone', 'telefone', 'celular', 'whatsapp', 'mobile', 'fone']
    const match = payload.questions_and_answers.find((qa) =>
      phoneKeywords.some((kw) => qa.question.toLowerCase().includes(kw))
    )
    if (match?.answer?.trim()) return match.answer.trim()
  }

  return null
}

async function handleInviteeCreated(
  organizationId: string,
  payload: Record<string, unknown>,
  sourceEvent: string
): Promise<NextResponse> {
  const inviteeUri = asString(payload.uri)
  const name = asString(payload.name)
  const email = asString(payload.email)?.toLowerCase()
  const scheduledEvent = getScheduledEvent(payload, sourceEvent)

  if (!email || !scheduledEvent?.uri || !scheduledEvent.start_time || !scheduledEvent.end_time) {
    return NextResponse.json({
      success: true,
      message: 'Evento sem dados mínimos para criação/atualização de agendamento',
    })
  }

  const eventUri = scheduledEvent.uri
  const eventName = scheduledEvent.name || 'Reunião Calendly'
  const location = scheduledEvent.location

  const phone = extractPhone(payload as CalendlyInviteePayload)

  // 1. Encontra o contato por telefone (se disponível) ou e-mail
  let contact = null

  if (phone) {
    contact = await prisma.contact.findFirst({
      where: { organizationId, phone },
      select: { id: true, name: true },
    })
  }

  if (!contact) {
    contact = await prisma.contact.findFirst({
      where: { organizationId, email: email.toLowerCase() },
      select: { id: true, name: true },
    })
  }

  if (!contact) {
    // Cria novo contato usando telefone real se disponível, senão sintético
    const contactPhone = phone ?? syntheticPhone(email)
    contact = await prisma.contact.create({
      data: {
        organizationId,
        name: name || email,
        email,
        phone: contactPhone,
      },
      select: { id: true, name: true },
    })
    console.log(`[Calendly Webhook] Contato criado: ${contact.id} (${email})`)
  } else {
    // Atualiza telefone real se ainda não tinha
    if (phone) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { phone },
      }).catch(() => {/* ignora conflito de unicidade */})
    }
    console.log(`[Calendly Webhook] Contato encontrado: ${contact.id} (${email})`)
  }

  // 2. Cria ou atualiza agendamento de forma idempotente
  const existingSchedule = await findScheduleByCalendlyRefs({
    organizationId,
    eventUri,
    inviteeUri,
    contactId: contact.id,
  })

  const scheduleData = {
    title: eventName,
    description: buildCalendlyDescription({
      name: name || undefined,
      email,
      eventUri,
      inviteeUri,
      sourceEvent,
    }),
    contactId: contact.id,
    startTime: new Date(scheduledEvent.start_time),
    endTime: new Date(scheduledEvent.end_time),
    location: extractLocation(location),
    status: 'pending' as const,
  }

  let scheduleId: string
  let created = false

  if (existingSchedule) {
    const updated = await prisma.schedule.update({
      where: { id: existingSchedule.id },
      data: scheduleData,
      select: { id: true },
    })
    scheduleId = updated.id
  } else {
    const createdSchedule = await prisma.schedule.create({
      data: {
        organizationId,
        type: 'meeting',
        ...scheduleData,
      },
      select: { id: true },
    })
    scheduleId = createdSchedule.id
    created = true
  }

  console.log(`[Calendly Webhook] Agendamento sincronizado: ${scheduleId} — "${eventName}" em ${scheduledEvent.start_time}`)

  // Incrementa contador de agendamentos na integração
  if (created) {
    await prisma.calendlyIntegration.updateMany({
      where: { organizationId },
      data: { totalBookings: { increment: 1 }, lastBookingAt: new Date() },
    })
  }

  return NextResponse.json({
    success: true,
    message: created ? 'Agendamento criado com sucesso' : 'Agendamento atualizado com sucesso',
    scheduleId,
    contactId: contact.id,
  })
}

// ─── invitee.canceled → cancela agendamento no CRM ──────────────────────────

async function handleInviteeCanceled(
  organizationId: string,
  payload: Record<string, unknown>,
  sourceEvent: string
): Promise<NextResponse> {
  const email = asString(payload.email)?.toLowerCase()
  const inviteeUri = asString(payload.uri)
  const cancellation = asObject(payload.cancellation)
  const cancellationReason = asString(cancellation?.reason)
  const scheduledEvent = getScheduledEvent(payload, sourceEvent)
  const eventUri = scheduledEvent?.uri

  if (!eventUri && !inviteeUri) {
    return NextResponse.json({ success: true, message: 'Evento sem referência de agendamento' })
  }

  let contactId: string | undefined
  if (email) {
    const contact = await prisma.contact.findFirst({
      where: { organizationId, email },
      select: { id: true },
    })
    contactId = contact?.id
  }

  const schedule = await findScheduleByCalendlyRefs({
    organizationId,
    eventUri: eventUri || undefined,
    inviteeUri: inviteeUri || undefined,
    contactId,
  })

  if (!schedule) {
    console.warn(`[Calendly Webhook] Agendamento não encontrado para cancelamento (eventUri: ${eventUri}, inviteeUri: ${inviteeUri}, email: ${email})`)
    return NextResponse.json({
      success: true,
      message: 'Agendamento não encontrado — nenhuma ação necessária',
    })
  }

  await prisma.schedule.update({
    where: { id: schedule.id },
    data: {
      status: 'cancelled',
      description: buildCalendlyDescription({
        name: asString(payload.name),
        email,
        eventUri: eventUri || undefined,
        inviteeUri: inviteeUri || undefined,
        cancellationReason,
        sourceEvent,
      }),
    },
  })

  console.log(`[Calendly Webhook] Agendamento cancelado: ${schedule.id}`)

  return NextResponse.json({
    success: true,
    message: 'Agendamento cancelado com sucesso',
    scheduleId: schedule.id,
  })
}

async function handleScheduledEventCanceled(
  organizationId: string,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const eventUri = asString(payload.uri)
  if (!eventUri) {
    return NextResponse.json({ success: true, message: 'Evento sem URI' })
  }

  const updateResult = await prisma.schedule.updateMany({
    where: {
      organizationId,
      status: 'pending',
      OR: [
        { description: { contains: `__calendly_event_uri: ${eventUri}` } },
        { description: { contains: `__calendly_uri: ${eventUri}` } },
      ],
    },
    data: { status: 'cancelled' },
  })

  return NextResponse.json({
    success: true,
    message: 'Cancelamento de evento sincronizado',
    affectedSchedules: updateResult.count,
  })
}

async function handleScheduledEventCreated(
  organizationId: string,
  payload: Record<string, unknown>
): Promise<NextResponse> {
  const eventUri = asString(payload.uri)
  const title = asString(payload.name)
  const startTime = asString(payload.start_time)
  const endTime = asString(payload.end_time)
  const location = asObject(payload.location) as CalendlyLocation | undefined

  if (!eventUri || !title || !startTime || !endTime) {
    return NextResponse.json({ success: true, message: 'Evento sem dados mínimos para atualização' })
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      organizationId,
      OR: [
        { description: { contains: `__calendly_event_uri: ${eventUri}` } },
        { description: { contains: `__calendly_uri: ${eventUri}` } },
      ],
    },
    select: { id: true, status: true },
  })

  if (schedules.length === 0) {
    return NextResponse.json({ success: true, message: 'Sem agendamentos relacionados para atualizar' })
  }

  await Promise.all(
    schedules.map((schedule) =>
      prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          title,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location: extractLocation(location),
          status: schedule.status === 'completed' ? 'completed' : 'pending',
        },
      })
    )
  )

  return NextResponse.json({
    success: true,
    message: 'Evento atualizado no CRM',
    affectedSchedules: schedules.length,
  })
}

async function handleInviteeNoShow(
  organizationId: string,
  payload: Record<string, unknown>,
  isNoShow: boolean
): Promise<NextResponse> {
  const inviteeUri = asString(payload.uri)
  const scheduledEvent = getScheduledEvent(payload, isNoShow ? 'invitee_no_show.created' : 'invitee_no_show.deleted')
  const eventUri = scheduledEvent?.uri

  const schedule = await findScheduleByCalendlyRefs({
    organizationId,
    eventUri,
    inviteeUri,
  })

  if (!schedule) {
    return NextResponse.json({ success: true, message: 'No-show sem agendamento relacionado no CRM' })
  }

  const noShowLine = isNoShow
    ? 'Status Calendly: No-show registrado'
    : 'Status Calendly: No-show removido'

  const currentDescription = schedule.description || ''
  const nextDescription = currentDescription.includes(noShowLine)
    ? currentDescription
    : `${currentDescription}${currentDescription ? '\n' : ''}${noShowLine}`

  await prisma.schedule.update({
    where: { id: schedule.id },
    data: { description: nextDescription },
  })

  return NextResponse.json({
    success: true,
    message: isNoShow ? 'No-show sincronizado' : 'Remoção de no-show sincronizada',
    scheduleId: schedule.id,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
