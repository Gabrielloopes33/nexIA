import { prisma } from '../lib/prisma'

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log('Tabelas existentes:')
  ;(tables as any[]).forEach(t => console.log(' -', t.table_name))
}

main().catch(console.error)
