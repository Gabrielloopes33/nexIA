#!/usr/bin/env tsx
/**
 * Script para verificar e corrigir a associação de usuário com organização
 * 
 * Uso:
 *   npx tsx scripts/fix-user-organization.ts [email]
 * 
 * Se não passar email, usa admin@nexia.chat por padrão
 */

import { prisma } from '@/lib/prisma'

const DEFAULT_EMAIL = 'admin@nexia.chat'

async function main() {
  const email = process.argv[2] || DEFAULT_EMAIL
  
  console.log(`🔍 Verificando usuário: ${email}\n`)

  // 1. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`❌ Usuário não encontrado: ${email}`)
    console.log('\n💡 Execute o seed para criar o usuário admin:')
    console.log('   npx tsx scripts/seed.ts')
    process.exit(1)
  }

  console.log(`✅ Usuário encontrado:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Nome: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   OrganizationId: ${user.organizationId || 'N/A'}\n`)

  // 2. Buscar organização
  let organization = await prisma.organization.findFirst({
    where: { status: 'ACTIVE' },
  })

  if (!organization) {
    console.log('🏢 Criando organização padrão...')
    organization = await prisma.organization.create({
      data: {
        name: 'NexIA Principal',
        slug: 'nexia-principal',
        status: 'ACTIVE',
      },
    })
    console.log(`   ✅ Organização criada: ${organization.name} (${organization.id})\n`)
  } else {
    console.log(`🏢 Organização encontrada: ${organization.name} (${organization.id})\n`)
  }

  // 3. Verificar membership
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      organizationId: organization.id,
    },
  })

  if (!membership) {
    console.log('🔗 Criando membership...')
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })
    console.log('   ✅ Membership criado\n')
  } else {
    console.log(`🔗 Membership existe: ${membership.role} (${membership.status})\n`)
  }

  // 4. Atualizar organizationId do usuário se necessário
  if (user.organizationId !== organization.id) {
    console.log('📝 Atualizando organizationId do usuário...')
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    })
    console.log('   ✅ Usuário atualizado\n')
  }

  console.log('='.repeat(60))
  console.log('✅ Correção concluída!')
  console.log('='.repeat(60))
  console.log('\n📝 Próximos passos:')
  console.log('   1. Faça logout na aplicação')
  console.log('   2. Faça login novamente')
  console.log('   3. Acesse a página de tags')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('\n❌ Erro:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
