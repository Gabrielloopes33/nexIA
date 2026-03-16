import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Verificar conexão em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Prisma conectado ao banco de dados')
    })
    .catch((error) => {
      console.error('❌ Erro ao conectar Prisma:', error.message)
      console.error('')
      console.error('╔════════════════════════════════════════════════════════════════╗')
      console.error('║  NÃO FOI POSSÍVEL CONECTAR AO BANCO DE DADOS                  ║')
      console.error('╠════════════════════════════════════════════════════════════════╣')
      console.error('║  O PostgreSQL na porta 5432 (ou 6543) está inacessível.       ║')
      console.error('║                                                                ║')
      console.error('║  SOLUÇÕES:                                                     ║')
      console.error('║                                                                ║')
      console.error('║  1. Abra a porta no firewall da VPS:                          ║')
      console.error('║     ssh root@49.13.228.89                                     ║')
      console.error('║     ufw allow 5432/tcp                                        ║')
      console.error('║     ufw reload                                                ║')
      console.error('║                                                                ║')
      console.error('║  2. Ou use Túnel SSH (execute em outro terminal):             ║')
      console.error('║     ssh -L 5432:localhost:5432 root@49.13.228.89 -N           ║')
      console.error('║     E mude .env.local para: localhost:5432                    ║')
      console.error('║                                                                ║')
      console.error('║  3. Ou use o Cloudflare Tunnel no EasyPanel                   ║')
      console.error('╚════════════════════════════════════════════════════════════════╝')
      console.error('')
    })
}
