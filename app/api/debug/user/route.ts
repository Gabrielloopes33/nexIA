import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Busca o usuário gabriel@gmail.com
    const user = await prisma.user.findUnique({
      where: { email: 'gabriel@gmail.com' },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        memberships: user.memberships.map(m => ({
          id: m.id,
          organizationId: m.organizationId,
          role: m.role,
          status: m.status,
          organization: m.organization ? {
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            status: m.organization.status,
          } : null
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Erro interno'
    }, { status: 500 })
  }
}
