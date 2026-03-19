import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth/password'

const EMAIL = process.argv[2] || 'gabriel@gmail.com'
const PASSWORD = process.argv[3] || 'senha123'

async function main() {
  try {
    // 1. Cria tabela de credenciais (se não existir)
    console.log('Criando tabela user_credentials...')
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
    console.log('✅ Tabela criada!')

    // 2. Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', EMAIL)
      process.exit(1)
    }

    console.log('✅ Usuário encontrado:', user.id, user.email)

    // 3. Cria hash da senha
    const hashed = await hashPassword(PASSWORD)
    console.log('Hash gerado:', hashed)

    // 4. Insere/atualiza credencial
    await prisma.$executeRawUnsafe(`
      INSERT INTO user_credentials (user_id, password_hash)
      VALUES ('${user.id}', '${hashed}')
      ON CONFLICT (user_id) 
      DO UPDATE SET password_hash = '${hashed}', updated_at = NOW()
    `)

    console.log('✅ Senha salva com sucesso!')
    console.log('Email:', EMAIL)
    console.log('Senha:', PASSWORD)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

main()
