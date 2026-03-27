import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'
import { createSession } from '@/lib/auth/session'

/**
 * GET /api/organizations/[id]
 * 
 * Retorna os dados de uma organização específica.
 * Requer que o usuário seja membro da organização.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const { id } = await params

    // Verifica se o usuário é membro da organização
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: id,
        userId: user.userId,
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Acesso negado. Você não é membro desta organização.' },
        { status: 403 }
      )
    }

    // Busca a organização
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        segment: true,
        logoUrl: true,
        setupComplete: true,
        status: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('[API] Erro ao buscar organização:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao buscar organização' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/organizations/[id]
 * 
 * Atualiza a organização durante o onboarding.
 * Requer que o usuário seja OWNER da organização.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    const { id } = await params

    // Verifica se o usuário é OWNER da organização
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: id,
        userId: user.userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas OWNER pode atualizar a organização.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, segment, logoUrl } = body

    // Validações básicas
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'Nome da organização não pode estar vazio' },
        { status: 400 }
      )
    }

    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json(
        { error: 'Slug não pode estar vazio' },
        { status: 400 }
      )
    }

    // Se estiver alterando o slug, verifica se já existe
    if (slug && slug.trim()) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          slug: slug.trim(),
          id: { not: id },
        },
      })

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Slug já está em uso por outra organização' },
          { status: 409 }
        )
      }
    }

    // Busca a organização atual para verificar campos obrigatórios
    const currentOrg = await prisma.organization.findUnique({
      where: { id },
    })

    if (!currentOrg) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Prepara os dados para atualização
    const updateData: {
      name?: string
      slug?: string
      segment?: string | null
      logoUrl?: string | null
      setupComplete?: boolean
    } = {}

    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) updateData.slug = slug.trim()
    if (segment !== undefined) updateData.segment = segment ? segment.trim() || null : null
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? logoUrl.trim() || null : null

    // Verifica se todos os campos obrigatórios estão preenchidos para marcar setup como completo
    const finalName = updateData.name ?? currentOrg.name
    const finalSlug = updateData.slug ?? currentOrg.slug
    const finalSegment = updateData.segment ?? currentOrg.segment

    // Marca setup como completo se todos os campos obrigatórios estiverem preenchidos
    if (finalName && finalSlug && finalSegment) {
      updateData.setupComplete = true
    }

    // Atualiza a organização
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData,
    })

    if (user.organizationId === updatedOrg.id) {
      await createSession({
        userId: user.userId,
        email: user.email,
        name: user.name,
        organizationId: updatedOrg.id,
        setupComplete: updatedOrg.setupComplete ?? false,
      })
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
        segment: updatedOrg.segment,
        logoUrl: updatedOrg.logoUrl,
        setupComplete: updatedOrg.setupComplete,
        status: updatedOrg.status,
        ownerId: updatedOrg.ownerId,
        createdAt: updatedOrg.createdAt,
        updatedAt: updatedOrg.updatedAt,
      },
    })
  } catch (error) {
    console.error('[API] Erro ao atualizar organização:', error)

    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao atualizar organização' },
      { status: 500 }
    )
  }
}
