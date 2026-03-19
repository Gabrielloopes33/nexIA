import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'

// Lista de emails permitidos
const ALLOWED_EMAILS = ['gabriel@gmail.com', 'gabriel2@gmail.com', 'ana@gmail.com', 'liz@gmail.com', 'camila1@gmail.com', 'vinicius2@gmail.com']

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 })
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Email não autorizado' }, { status: 403 })
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Cria hash da senha
    const hashed = await hashPassword(password)

    // Insere/atualiza na tabela user_credentials (já deve existir)
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO user_credentials (user_id, password_hash)
        VALUES ('${user.id}'::uuid, '${hashed}')
        ON CONFLICT (user_id) 
        DO UPDATE SET password_hash = '${hashed}', updated_at = NOW()
      `)
    } catch (insertError: any) {
      // Se a tabela não existe, informa o usuário
      if (insertError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Tabela user_credentials não existe. Execute o SQL no Supabase Studio primeiro.' 
        }, { status: 500 })
      }
      throw insertError
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Senha configurada com sucesso',
      email: user.email 
    })
  } catch (error: any) {
    console.error('[SetupPassword] Erro:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno' 
    }, { status: 500 })
  }
}
