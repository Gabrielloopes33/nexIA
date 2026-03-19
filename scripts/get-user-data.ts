import { prisma } from '../lib/prisma'

async function main() {
  try {
    const users = await prisma.$queryRaw`
      SELECT * FROM users WHERE email = 'gabriel@gmail.com' LIMIT 1
    `
    const user = (users as any[])[0]
    console.log('Keys:', Object.keys(user))
    console.log('Data:', JSON.stringify(user, null, 2))
  } catch (error) {
    console.error('Erro:', error)
  }
}

main()
