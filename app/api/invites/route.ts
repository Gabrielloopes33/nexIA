import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

/**
 * POST /api/invites
 * 
 * Envia convites para membros da equipe.
 * Requer que o usuário seja OWNER da organização.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const { emails, organizationId } = body

    // Validações
    if (!organizationId?.trim()) {
      return NextResponse.json(
        { error: 'ID da organização é obrigatório' },
        { status: 400 }
      )
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um email deve ser fornecido' },
        { status: 400 }
      )
    }

    // Limita número de convites por requisição
    if (emails.length > 50) {
      return NextResponse.json(
        { error: 'Máximo de 50 convites por requisição' },
        { status: 400 }
      )
    }

    // Verifica se o usuário é OWNER da organização
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas OWNER pode enviar convites.' },
        { status: 403 }
      )
    }
    // Valida formato dos emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails: string[] = []
    const invalidEmails: string[] = []

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase()
      if (emailRegex.test(trimmedEmail)) {
        validEmails.push(trimmedEmail)
      } else {
        invalidEmails.push(email)
      }
    }

    if (validEmails.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum email válido fornecido', invalidEmails },
        { status: 400 }
      )
    }

    // Busca informações da organização
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se algum email já está convidado ou é membro
    const existingMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        user: {
          email: {
            in: validEmails,
          },
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    const existingEmails = new Set(existingMembers.map(m => m.user?.email?.toLowerCase()).filter(Boolean))
    const newEmails = validEmails.filter(email => !existingEmails.has(email))

    // TODO: Em produção, implementar:
    // 1. Criar tabela de invites pendentes no banco
    // 2. Gerar tokens únicos para cada convite
    // 3. Enviar emails com link de aceitação
    // 4. Criar endpoint para aceitar/recusar convite

    // Por enquanto, apenas loga os convites
    const invites = newEmails.map(email => ({
      email,
      organizationId,
      invitedBy: user.userId,
      invitedAt: new Date(),
      token: generateInviteToken(),
      status: 'PENDING' as const,
    }))

    console.log('[API] Convites gerados:', {
      organizationId,
      organizationName: organization.name,
      invitedBy: user.userId,
      totalInvites: invites.length,
      invites: invites.map(i => ({ email: i.email, token: i.token })),
      skipped: existingEmails.size > 0 ? Array.from(existingEmails) : undefined,
      invalid: invalidEmails.length > 0 ? invalidEmails : undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Convites processados com sucesso',
      data: {
        sent: invites.length,
        invites: invites.map(i => ({
          email: i.email,
          status: i.status,
        })),
        skipped: existingEmails.size > 0 ? Array.from(existingEmails) : [],
        invalid: invalidEmails,
      },
      note: 'Em produção, emails serão enviados com links de aceitação',
    })
  } catch (error) {
    console.error('[API] Erro ao enviar convites:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar convites' },
      { status: 500 }
    )
  }
}

/**
 * Gera um token único para o convite
 */
function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
