import { prisma } from '../lib/prisma'

async function main() {
  try {
    // Cria tabela para credenciais custom
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        password_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `)
    console.log('✅ Tabela user_credentials criada!')
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Tabela já existe')
    } else {
      console.error('Erro:', error)
    }
  }
}

main()
