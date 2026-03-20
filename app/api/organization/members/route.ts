import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/password'

/**
 * GET /api/organization/members
 * 
 * Lista todos os membros da organização atual
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    // Busca todos os membros da organização
    const members = await prisma.organizationMember.findMany({
      where: { 
        organizationId: user.organizationId 
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formata os dados para o frontend
    const formattedMembers = members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user?.name || 'Sem nome',
      email: member.user?.email || '',
      avatarUrl: member.user?.avatarUrl,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      lastAccess: member.updatedAt,
      userStatus: member.user?.status,
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error('[API] Erro ao buscar membros:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao carregar membros' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organization/members
 * 
 * Cria um novo usuário com senha e vincula à organização
 */
export async function POST(req: Request) {
  try {
    const currentUser = await getAuthenticatedUser()

    if (!currentUser.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    const { name, email, password, role } = await req.json()

    // Validações
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Senha é obrigatória e deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verifica se já existe usuário com este email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este e-mail' },
        { status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Cria usuário, credenciais e membership em transação
    const result = await prisma.$transaction(async (tx) => {
      // Cria o usuário
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: name?.trim() || normalizedEmail.split('@')[0],
          status: 'ACTIVE',
          organizationId: currentUser.organizationId,
        }
      })

      // Cria as credenciais
      await tx.userCredential.create({
        data: {
          userId: user.id,
          passwordHash,
        }
      })

      // Cria o membership na organização
      const membership = await tx.organizationMember.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: user.id,
          role: role || 'MEMBER',
          status: 'ACTIVE', // Já ativo pois a senha foi definida
        }
      })

      return { user, membership }
    })

    return NextResponse.json({
      id: result.membership.id,
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      role: result.membership.role,
      status: result.membership.status,
      joinedAt: result.membership.joinedAt,
      message: 'Usuário criado com sucesso. Pode fazer login imediatamente.'
    })
  } catch (error) {
    console.error('[API] Erro ao criar membro:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar membro' },
      { status: 500 }
    )
  }
}
