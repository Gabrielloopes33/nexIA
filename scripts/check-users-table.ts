import { prisma } from '../lib/prisma'

async function main() {
  try {
    // Lista colunas da tabela users
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    console.log('Colunas na tabela users:')
    console.table(columns)
    
    // Busca usuário
    const user = await prisma.$queryRaw`
      SELECT * FROM users WHERE email = 'gabriel@gmail.com'
    `
    console.log('\nDados do usuário:')
    console.log(user)
  } catch (error) {
    console.error('Erro:', error)
  }
}

main()
