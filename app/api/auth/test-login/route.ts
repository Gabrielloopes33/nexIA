import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    console.log('[TestLogin] Email recebido:', email)
    
    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    
    console.log('[TestLogin] Usuário encontrado:', user.id)
    
    // Busca credencial
    const creds: any[] = await prisma.$queryRaw`
      SELECT password_hash FROM user_credentials WHERE user_id = ${user.id}::uuid
    `
    
    console.log('[TestLogin] Credenciais encontradas:', creds.length)
    
    if (!creds.length) {
      return NextResponse.json({ error: 'Credencial não encontrada' }, { status: 404 })
    }
    
    const storedHash = creds[0].password_hash
    console.log('[TestLogin] Hash armazenado:', storedHash.substring(0, 20) + '...')
    
    // Verifica senha
    const valid = await verifyPassword(password, storedHash)
    console.log('[TestLogin] Senha válida:', valid)
    
    return NextResponse.json({ 
      ok: true, 
      userId: user.id,
      passwordValid: valid,
      storedHashLength: storedHash.length,
    })
    
  } catch (error: any) {
    console.error('[TestLogin] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      details: error.message 
    }, { status: 500 })
  }
}

// GET para testar se a rota está acessível
export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: 'Rota de teste funcionando',
    database: process.env.DATABASE_URL?.replace(/:.*@/, ':****@') || 'não configurado'
  })
}
