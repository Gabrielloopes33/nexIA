import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Busca o token no banco
    const tokens: any[] = await prisma.$queryRaw`
      SELECT id, user_id, expires_at, used_at 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    const resetToken = tokens[0]

    // Verifica se o token já foi usado
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado' },
        { status: 400 }
      )
    }

    // Verifica se o token expirou
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Este link expirou. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Gera o hash da nova senha
    const passwordHash = await hashPassword(password)

    // Atualiza a senha do usuário
    await prisma.$executeRaw`
      UPDATE user_credentials 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE user_id = ${resetToken.user_id}::uuid
    `

    // Marca o token como usado
    await prisma.$executeRaw`
      UPDATE password_reset_tokens 
      SET used_at = NOW()
      WHERE id = ${resetToken.id}::uuid
    `

    console.log(`[ResetPassword] Senha redefinida para usuário: ${resetToken.user_id}`)

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ResetPassword] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    )
  }
}

// Endpoint para validar token (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      )
    }

    // Busca o token no banco
    const tokens: any[] = await prisma.$queryRaw`
      SELECT id, expires_at, used_at 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

    if (tokens.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido' },
        { status: 200 }
      )
    }

    const resetToken = tokens[0]

    // Verifica se o token já foi usado
    if (resetToken.used_at) {
      return NextResponse.json(
        { valid: false, error: 'Este link já foi utilizado' },
        { status: 200 }
      )
    }

    // Verifica se o token expirou
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'Este link expirou' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ResetPassword] Erro ao validar token:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro ao validar token' },
      { status: 500 }
    )
  }
}
