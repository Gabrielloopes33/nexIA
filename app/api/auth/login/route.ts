import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    console.log('[Login] =======================================')
    console.log('[Login] Tentando login para:', email)

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      console.log('[Login] Usuário não encontrado')
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    console.log('[Login] Usuário encontrado:', user.id)

    // Busca credencial na tabela user_credentials
    let creds: any[]
    try {
      creds = await prisma.$queryRaw`
        SELECT password_hash FROM user_credentials WHERE user_id = ${user.id}::uuid
      `
    } catch (dbError: any) {
      console.log('[Login] Erro ao buscar credencial:', dbError.message)
      return NextResponse.json({ 
        error: 'Erro ao verificar credenciais. Tabela user_credentials pode não existir.' 
      }, { status: 500 })
    }

    if (!creds.length) {
      console.log('[Login] Credencial não encontrada')
      return NextResponse.json({ 
        error: 'Senha não configurada. Use /setup-password primeiro.' 
      }, { status: 401 })
    }

    const storedHash = creds[0].password_hash
    const valid = await verifyPassword(password, storedHash)

    if (!valid) {
      console.log('[Login] Senha incorreta')
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    console.log('[Login] Senha válida!')

    // Busca organização do usuário
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { organization: true },
    })

    console.log('[Login] Membership:', membership?.organizationId || 'Nenhuma')

    // Cria sessão JWT custom
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: membership?.organizationId ?? null,
      setupComplete: membership?.organization?.setupComplete ?? false,
    })

    console.log('[Login] Sessão criada com sucesso!')

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Login] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
