import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth/password'

const EMAIL = 'gabriel@gmail.com'
const PASSWORD = '123123123'

async function main() {
  try {
    console.log('Configurando senha para:', EMAIL)

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', EMAIL)
      process.exit(1)
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Cria tabela se não existir
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_credentials (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        )
      `)
      console.log('✅ Tabela criada/verificada')
    } catch (e: any) {
      console.log('⚠️ Erro ao criar tabela:', e.message)
    }

    // Cria hash
    const hashed = await hashPassword(PASSWORD)
    console.log('Hash gerado:', hashed.substring(0, 30) + '...')

    // Insere/atualiza usando raw query
    await prisma.$executeRawUnsafe(`
      INSERT INTO user_credentials (user_id, password_hash)
      VALUES ('${user.id}', '${hashed}')
      ON CONFLICT (user_id) 
      DO UPDATE SET password_hash = '${hashed}', updated_at = NOW()
    `)

    console.log('✅ Senha configurada com sucesso!')
    console.log('Email:', EMAIL)
    console.log('Senha:', PASSWORD)
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
