import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const displayName = name || normalizedEmail.split('@')[0]

    // Verifica se o email já existe
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const userId = randomUUID()
    const passwordHash = await hashPassword(password)

    // Cria organização padrão
    const org = await prisma.organization.create({
      data: {
        name: 'Minha Organização',
        slug: `org-${userId.slice(0, 8)}`,
      },
    })

    // Cria usuário, membership e credencial em transação
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: displayName,
          organizationId: org.id,
        },
      }),
      prisma.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      }),
      prisma.$executeRaw`
        INSERT INTO user_credentials (user_id, password_hash)
        VALUES (${userId}::uuid, ${passwordHash})
      `,
    ])

    await createSession({
      userId,
      email: normalizedEmail,
      name: displayName,
      organizationId: org.id,
      setupComplete: org.setupComplete ?? false,
    })

    return NextResponse.json({ ok: true, userId })
  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
