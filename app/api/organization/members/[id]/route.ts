import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError, createAuthErrorResponse } from '@/lib/auth/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/organization/members/[id]
 * 
 * Atualiza um membro da organização (role, status)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser()
    const { id: memberId } = await params

    if (!currentUser.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      )
    }

    const { role, status } = await request.json()

    // Verifica se o membro existe e pertence à organização
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: currentUser.organizationId
      }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Atualiza o membro
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        ...(role && { role }),
        ...(status && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedMember.id,
      userId: updatedMember.userId,
      name: updatedMember.user?.name || 'Sem nome',
      email: updatedMember.user?.email || '',
      avatarUrl: updatedMember.user?.avatarUrl,
      role: updatedMember.role,
      status: updatedMember.status,
      joinedAt: updatedMember.joinedAt,
    })
  } catch (error) {
    console.error('[API] Erro ao atualizar membro:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao atualizar membro' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organization/members/[id]
 * 
 * Remove um membro da organização
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser()
    const { id: memberId } = await params

    if (!currentUser.organizationId) {
      return NextResponse.json(
        { error: 'Usuário não possui organização' },
        { status: 404 }
      )
    }

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se o membro existe e pertence à organização
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId: currentUser.organizationId
      }
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    // Impede que o usuário se remova
    if (existingMember.userId === currentUser.userId) {
      return NextResponse.json(
        { error: 'Você não pode remover a si mesmo' },
        { status: 403 }
      )
    }

    // Remove o membro
    await prisma.organizationMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Membro removido com sucesso' 
    })
  } catch (error) {
    console.error('[API] Erro ao remover membro:', error)
    
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error)
    }

    return NextResponse.json(
      { error: 'Erro interno ao remover membro' },
      { status: 500 }
    )
  }
}
