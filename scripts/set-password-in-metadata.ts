import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth/password'

const EMAIL = process.argv[2] || 'gabriel@gmail.com'
const NEW_PASSWORD = process.argv[3] || 'senha123'

async function main() {
  try {
    // Busca usuário
    const users = await prisma.$queryRaw`
      SELECT id, email, raw_user_meta_data 
      FROM users 
      WHERE email = ${EMAIL}
    `
    
    if (!users || (users as any[]).length === 0) {
      console.log('❌ Usuário não encontrado:', EMAIL)
      process.exit(1)
    }
    
    const user = (users as any[])[0]
    console.log('✅ Usuário encontrado:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Meta data atual:', user.raw_user_meta_data)

    // Cria hash da senha
    const hashed = await hashPassword(NEW_PASSWORD)
    console.log('\nNova senha hash:', hashed)

    // Atualiza raw_user_meta_data com o password_hash
    const newMetaData = {
      ...user.raw_user_meta_data,
      custom_password_hash: hashed
    }
    
    await prisma.$executeRaw`
      UPDATE users 
      SET raw_user_meta_data = ${JSON.stringify(newMetaData)}::jsonb
      WHERE id = ${user.id}
    `

    console.log('\n✅ Senha salva no raw_user_meta_data!')
    console.log('Email:', EMAIL)
    console.log('Nova senha:', NEW_PASSWORD)
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  }
}

main()
