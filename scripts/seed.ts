#!/usr/bin/env tsx
/**
 * Script de Seed - Popula o banco com dados iniciais
 * 
 * Uso:
 *   npx tsx scripts/seed.ts
 * 
 * Este script cria:
 *   - Organização principal
 *   - Usuário admin
 *   - Tags de exemplo
 *   - Listas de exemplo
 *   - Pipeline stages (funil de vendas)
 *   - Planos de assinatura
 */

import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { randomUUID } from 'crypto'

const ADMIN_EMAIL = 'admin@nexia.chat'
const ADMIN_PASSWORD = 'admin123456'
const ADMIN_NAME = 'Administrador'

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // ============================================================
  // 1. CRIAR ORGANIZAÇÃO PRINCIPAL
  // ============================================================
  console.log('🏢 Criando organização principal...')
  
  const organization = await prisma.organization.upsert({
    where: { slug: 'nexia-principal' },
    update: {},
    create: {
      name: 'NexIA Principal',
      slug: 'nexia-principal',
      status: 'ACTIVE',
    },
  })
  
  console.log(`   ✅ Organização: ${organization.name} (${organization.id})\n`)

  // ============================================================
  // 2. CRIAR USUÁRIO ADMIN
  // ============================================================
  console.log('👤 Criando usuário admin...')
  
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  let adminUser
  
  if (!existingUser) {
    const userId = randomUUID()
    const passwordHash = await hashPassword(ADMIN_PASSWORD)

    // Criar usuário, membership e credencial em transação
    await prisma.$transaction(async (tx) => {
      adminUser = await tx.user.create({
        data: {
          id: userId,
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          organizationId: organization.id,
          status: 'ACTIVE',
        },
      })

      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: organization.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      })

      // Inserir credencial usando SQL raw (tabela não está no schema Prisma)
      await tx.$executeRaw`
        INSERT INTO user_credentials (user_id, password_hash)
        VALUES (${userId}::uuid, ${passwordHash})
        ON CONFLICT (user_id) DO UPDATE SET password_hash = ${passwordHash}
      `
    })

    console.log(`   ✅ Usuário admin criado:`)
    console.log(`      Email: ${ADMIN_EMAIL}`)
    console.log(`      Senha: ${ADMIN_PASSWORD}`)
    console.log(`      ID: ${adminUser?.id}\n`)
  } else {
    adminUser = existingUser
    console.log(`   ⚠️  Usuário admin já existe: ${ADMIN_EMAIL}\n`)
  }

  // ============================================================
  // 3. CRIAR PIPELINE STAGES (FUNIL DE VENDAS)
  // ============================================================
  console.log('🔄 Criando estágios do pipeline...')
  
  const stages = [
    { name: 'Novo Lead', color: '#6b7280', position: 0, probability: 10 },
    { name: 'Qualificado', color: '#3b82f6', position: 1, probability: 25 },
    { name: 'Proposta Enviada', color: '#8b5cf6', position: 2, probability: 50 },
    { name: 'Negociação', color: '#f59e0b', position: 3, probability: 75 },
    { name: 'Fechado Ganho', color: '#10b981', position: 4, probability: 100, isClosed: true },
    { name: 'Fechado Perdido', color: '#ef4444', position: 5, probability: 0, isClosed: true },
  ]

  for (const stage of stages) {
    // Buscar se já existe um estágio com esse nome na organização
    const existing = await prisma.pipelineStage.findFirst({
      where: {
        organizationId: organization.id,
        name: stage.name,
      },
    })
    
    if (existing) {
      // Atualiza se necessário
      await prisma.pipelineStage.update({
        where: { id: existing.id },
        data: {
          position: stage.position,
          color: stage.color,
          probability: stage.probability,
          isDefault: stage.position === 0,
          isClosed: stage.isClosed || false,
        },
      })
    } else {
      // Cria novo
      await prisma.pipelineStage.create({
        data: {
          organizationId: organization.id,
          name: stage.name,
          color: stage.color,
          position: stage.position,
          probability: stage.probability,
          isDefault: stage.position === 0,
          isClosed: stage.isClosed || false,
        },
      })
    }
  }

  console.log(`   ✅ ${stages.length} estágios criados\n`)

  // ============================================================
  // 4. CRIAR TAGS DE EXEMPLO
  // ============================================================
  console.log('🏷️  Criando tags de exemplo...')
  
  const tags = [
    { name: 'VIP', color: '#ef4444' },
    { name: 'Lead Quente', color: '#f97316' },
    { name: 'Lead Frio', color: '#3b82f6' },
    { name: 'Cliente', color: '#10b981' },
    { name: 'Parceiro', color: '#8b5cf6' },
    { name: 'Fornecedor', color: '#6b7280' },
    { name: 'WhatsApp', color: '#25d366' },
    { name: 'Instagram', color: '#e1306c' },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: tag.name,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: tag.name,
        color: tag.color,
        source: 'manual',
      },
    })
  }

  console.log(`   ✅ ${tags.length} tags criadas\n`)

  // ============================================================
  // 5. CRIAR LISTAS DE EXEMPLO
  // ============================================================
  console.log('📋 Criando listas de exemplo...')
  
  const lists = [
    { 
      name: 'Clientes VIP', 
      description: 'Clientes de alto valor',
      color: '#ef4444',
    },
    { 
      name: 'Leads de Marketing', 
      description: 'Leads vindos de campanhas',
      color: '#3b82f6',
    },
    { 
      name: 'Parceiros Comerciais', 
      description: 'Parceiros e integradores',
      color: '#8b5cf6',
    },
  ]

  for (const list of lists) {
    const existing = await prisma.list.findFirst({
      where: {
        organizationId: organization.id,
        name: list.name,
      },
    })
    
    if (!existing) {
      await prisma.list.create({
        data: {
          organizationId: organization.id,
          name: list.name,
          description: list.description,
          color: list.color,
          filters: {},
          isDynamic: false,
        },
      })
    }
  }

  console.log(`   ✅ ${lists.length} listas criadas\n`)

  // ============================================================
  // 6. CRIAR PLANOS DE ASSINATURA
  // ============================================================
  console.log('💎 Criando planos de assinatura...')
  
  const plans = [
    {
      name: 'Gratuito',
      description: 'Para começar',
      price: 0,
      interval: 'month',
      features: ['100 contatos', '1 usuário', 'Suporte básico'],
    },
    {
      name: 'Pro',
      description: 'Para equipes em crescimento',
      price: 9700, // R$ 97,00 em centavos
      interval: 'month',
      features: ['10.000 contatos', '5 usuários', 'Suporte prioritário', 'API access'],
    },
    {
      name: 'Enterprise',
      description: 'Para grandes empresas',
      price: 29700, // R$ 297,00 em centavos
      interval: 'month',
      features: ['Contatos ilimitados', 'Usuários ilimitados', 'Suporte 24/7', 'API dedicada', 'SLA'],
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({
      where: { name: plan.name },
    })
    
    if (!existing) {
      await prisma.plan.create({
        data: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          interval: plan.interval,
          features: JSON.stringify(plan.features),
          is_active: true,
        },
      })
    }
  }

  console.log(`   ✅ ${plans.length} planos criados\n`)

  // ============================================================
  // 7. CRIAR CONTATOS DE EXEMPLO
  // ============================================================
  console.log('👥 Criando contatos de exemplo...')
  
  const sampleContacts = [
    { name: 'João Silva', phone: '5511999999991', tags: ['Cliente', 'VIP'] },
    { name: 'Maria Santos', phone: '5511999999992', tags: ['Lead Quente'] },
    { name: 'Pedro Costa', phone: '5511999999993', tags: ['Lead Frio'] },
    { name: 'Ana Paula', phone: '5511999999994', tags: ['Cliente'] },
    { name: 'Carlos Eduardo', phone: '5511999999995', tags: ['Parceiro'] },
  ]

  for (const contact of sampleContacts) {
    await prisma.contact.upsert({
      where: {
        organizationId_phone: {
          organizationId: organization.id,
          phone: contact.phone,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: contact.name,
        phone: contact.phone,
        status: 'ACTIVE',
        leadScore: Math.floor(Math.random() * 100),
        metadata: {
          source: 'seed',
          city: 'São Paulo',
          state: 'SP',
        },
      },
    })
  }

  console.log(`   ✅ ${sampleContacts.length} contatos criados\n`)

  // ============================================================
  // RESUMO
  // ============================================================
  console.log('='.repeat(60))
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!')
  console.log('='.repeat(60))
  console.log('\n📊 Resumo:')
  console.log(`   • Organização: ${organization.name}`)
  console.log(`   • Usuário Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  console.log(`   • Pipeline: ${stages.length} estágios`)
  console.log(`   • Tags: ${tags.length}`)
  console.log(`   • Listas: ${lists.length}`)
  console.log(`   • Planos: ${plans.length}`)
  console.log(`   • Contatos: ${sampleContacts.length}`)
  console.log('\n🚀 Pronto para usar!')
  console.log(`   Acesse: http://localhost:3000/login`)
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('\n❌ Erro durante o seed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
