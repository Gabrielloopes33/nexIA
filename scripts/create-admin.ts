/**
 * Script para criar usuário administrador inicial
 *
 * Uso:
 *   npx tsx scripts/create-admin.ts
 *
 * Variáveis de ambiente necessárias:
 *   DATABASE_URL   - URL do banco de dados
 *   ADMIN_EMAIL    - Email do admin (padrão: admin@nexiachat.com.br)
 *   ADMIN_PASSWORD - Senha do admin (obrigatório)
 *   ADMIN_NAME     - Nome do admin (padrão: Administrador)
 *   ORG_NAME       - Nome da organização (padrão: NexIA)
 */

import { PrismaClient } from '@prisma/client'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)
const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@nexiachat.com.br'
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Administrador'
  const orgName = process.env.ORG_NAME || 'NexIA'

  if (!password) {
    console.error('❌ ADMIN_PASSWORD é obrigatório')
    console.error('   Exemplo: ADMIN_PASSWORD=suasenha npx tsx scripts/create-admin.ts')
    process.exit(1)
  }

  console.log(`\n🔧 Criando usuário admin: ${email}`)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Atualiza a senha se o usuário já existe
    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { email },
      data: { passwordHash, name },
    })
    console.log('✅ Senha do usuário existente atualizada')
    return
  }

  const passwordHash = await hashPassword(password)

  // Cria usuário
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  })

  // Cria organização principal
  const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      ownerId: user.id,
      status: 'ACTIVE',
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    },
  })

  console.log(`✅ Usuário criado: ${user.email} (id: ${user.id})`)
  console.log(`✅ Organização criada: ${org.name} (slug: ${org.slug})`)
  console.log(`\n🔑 Credenciais de acesso:`)
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${password}`)
  console.log(`\n⚠️  Guarde essas credenciais em local seguro!\n`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
