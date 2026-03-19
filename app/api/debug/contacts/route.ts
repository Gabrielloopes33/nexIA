import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, AuthError } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user.organizationId) {
      return NextResponse.json({ error: 'Sem organização' }, { status: 403 })
    }

    const contacts = await prisma.contact.findMany({
      where: { 
        organizationId: user.organizationId,
        deletedAt: null 
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ 
      organizationId: user.organizationId,
      count: contacts.length,
      contacts 
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
