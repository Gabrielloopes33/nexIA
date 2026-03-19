import { prisma } from '../lib/prisma'
import { hashPassword } from '../lib/auth/password'

const EMAIL = process.argv[2] || 'gabriel@gmail.com'
const NEW_PASSWORD = process.argv[3] || 'senha123'

async function main() {
  try {
    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true, email: true, passwordHash: true, name: true }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', EMAIL)
      process.exit(1)
    }

    console.log('✅ Usuário encontrado:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Tem passwordHash?:', user.passwordHash ? 'Sim' : 'Não')
    console.log('  passwordHash:', user.passwordHash)

    // Cria nova senha
    const hashed = await hashPassword(NEW_PASSWORD)
    console.log('\nNova senha hash:', hashed)

    // Atualiza usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed }
    })

    console.log('\n✅ Senha atualizada com sucesso!')
    console.log('Email:', EMAIL)
    console.log('Nova senha:', NEW_PASSWORD)
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  }
}

main()
