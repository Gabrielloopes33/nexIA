import { prisma } from '../lib/prisma'

async function main() {
  try {
    // Adiciona coluna password_hash se não existir
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `)
    console.log('✅ Coluna password_hash adicionada com sucesso!')
  } catch (error) {
    console.error('Erro:', error)
    process.exit(1)
  }
}

main()
