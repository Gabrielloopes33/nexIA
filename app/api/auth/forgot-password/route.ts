import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail, getPasswordResetTemplate } from '@/lib/email'

// Tempo de expiração do token (1 hora)
const TOKEN_EXPIRY_HOURS = 1

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Busca o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Por segurança, não revelamos se o email existe ou não
    // Retornamos sucesso mesmo se o usuário não existir
    if (!user) {
      console.log(`[ForgotPassword] Email não encontrado: ${email}`)
      return NextResponse.json(
        { message: 'Se o email existir, você receberá um link de recuperação' },
        { status: 200 }
      )
    }

    // Gera um token aleatório seguro
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS)

    // Salva o token no banco usando raw query (tabela password_reset_tokens)
    try {
      await prisma.$executeRaw`
        INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
        VALUES (gen_random_uuid(), ${user.id}::uuid, ${token}, ${expiresAt}, NOW())
      `
    } catch (dbError: any) {
      // Se a tabela não existir, tenta criar
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        console.log('[ForgotPassword] Criando tabela password_reset_tokens...')
        
        try {
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              token VARCHAR(255) NOT NULL UNIQUE,
              expires_at TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT NOW(),
              used_at TIMESTAMP
            )
          `
          
          // Tenta inserir novamente
          await prisma.$executeRaw`
            INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
            VALUES (gen_random_uuid(), ${user.id}::uuid, ${token}, ${expiresAt}, NOW())
          `
        } catch (createError) {
          console.error('[ForgotPassword] Erro ao criar tabela:', createError)
          return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
          )
        }
      } else {
        throw dbError
      }
    }

    // Constrói o link de recuperação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexiachat.com.br'
    const resetLink = `${baseUrl}/redefinir-senha?token=${token}`

    // Envia o email de recuperação
    try {
      const emailHtml = getPasswordResetTemplate(resetLink, user.name || undefined)
      await sendEmail({
        to: email,
        subject: 'Recuperação de Senha - NexIA Chat',
        html: emailHtml,
      })
      console.log(`[ForgotPassword] Email enviado para: ${email}`)
    } catch (emailError: any) {
      // Se falhar o envio, não revelamos o erro ao usuário por segurança
      // Mas logamos para debug
      console.error('[ForgotPassword] Erro ao enviar email:', emailError)
    }

    return NextResponse.json(
      { message: 'Se o email existir, você receberá um link de recuperação' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[ForgotPassword] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
