import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { createSession } from '@/lib/auth/session'

/**
 * POST /api/organizations
 * 
 * Cria uma nova organização e vincula o usuário atual como OWNER
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    const { name, slug } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome da organização é obrigatório' },
        { status: 400 }
      )
    }

    // Gera slug se não fornecido
    const finalSlug = slug?.trim() || name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Verifica se slug já existe
    const existing = await prisma.organization.findUnique({
      where: { slug: finalSlug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug já existe. Escolha outro nome.' },
        { status: 409 }
      )
    }

    // Cria organização e membership em transação
    const result = await prisma.$transaction(async (tx) => {
      // Cria organização
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          status: 'ACTIVE',
          ownerId: user.userId,
        }
      })

      // Cria membership como OWNER
      const membership = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.userId,
          role: 'OWNER',
          status: 'ACTIVE',
        }
      })

      // Atualiza organizationId legado no usuário
      await tx.user.update({
        where: { id: user.userId },
        data: { organizationId: organization.id }
      })

      return { organization, membership }
    })

    // Atualiza sessão para nova organização
    await createSession({
      userId: user.userId,
      email: user.email,
      name: user.name,
      organizationId: result.organization.id,
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      }
    })
  } catch (error) {
    console.error('[API] Erro ao criar organização:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar organização' },
      { status: 500 }
    )
  }
}
