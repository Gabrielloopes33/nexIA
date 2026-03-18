#!/usr/bin/env tsx
/**
 * Script de Migração: Criar OrganizationMember para usuários órfãos
 * 
 * Problema: Usuários têm organization_id legado mas não têm registro em organization_members
 * Solução: Criar OrganizationMember para cada usuário órfão com role OWNER
 * 
 * Uso: npx tsx scripts/migrate-org-members.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface MigrationResult {
  userId: string;
  email: string;
  organizationId: string;
  action: 'created' | 'skipped' | 'error';
  error?: string;
}

async function migrateOrgMembers(dryRun: boolean = false): Promise<MigrationResult[]> {
  console.log(`🔧 Iniciando migração de OrganizationMembers${dryRun ? ' (DRY RUN)' : ''}...\n`);

  // Buscar usuários órfãos (com organization_id mas sem organization_members)
  const orphanedUsers = await prisma.$queryRaw<Array<{
    user_id: string;
    email: string;
    legacy_org_id: string;
    name: string;
    created_at: Date;
  }>>`
    SELECT 
      u.id as user_id, 
      u.email, 
      u.organization_id as legacy_org_id,
      u.name,
      u.created_at
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL AND u.organization_id IS NOT NULL
  `;

  console.log(`📊 Encontrados ${orphanedUsers.length} usuário(s) órfão(s) para migrar\n`);

  if (orphanedUsers.length === 0) {
    console.log('✅ Nenhum usuário órfão encontrado. Nada a fazer.');
    return [];
  }

  const results: MigrationResult[] = [];

  for (const user of orphanedUsers) {
    console.log(`👤 Processando: ${user.email} (${user.name || 'sem nome'})`);
    console.log(`   User ID: ${user.user_id}`);
    console.log(`   Legacy Org ID: ${user.legacy_org_id}`);

    try {
      // Verificar se a organização existe
      const organization = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM organizations WHERE id = ${user.legacy_org_id}::uuid
      `;

      if (organization.length === 0) {
        console.log(`   ⚠️  Organização ${user.legacy_org_id} não encontrada!`);
        results.push({
          userId: user.user_id,
          email: user.email,
          organizationId: user.legacy_org_id,
          action: 'error',
          error: 'Organização não encontrada'
        });
        continue;
      }

      console.log(`   Organização: ${organization[0].name}`);

      if (!dryRun) {
        // Criar OrganizationMember
        await prisma.$executeRaw`
          INSERT INTO organization_members (
            id,
            organization_id,
            user_id,
            role,
            status,
            joined_at,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${user.legacy_org_id}::uuid,
            ${user.user_id}::uuid,
            'OWNER',
            'ACTIVE',
            NOW(),
            NOW(),
            NOW()
          )
        `;

        // Atualizar owner_id da organização se estiver nulo
        await prisma.$executeRaw`
          UPDATE organizations 
          SET owner_id = ${user.user_id}::uuid
          WHERE id = ${user.legacy_org_id}::uuid
            AND (owner_id IS NULL OR owner_id != ${user.user_id}::uuid)
        `;

        console.log(`   ✅ OrganizationMember criado com sucesso (role: OWNER)`);
      } else {
        console.log(`   📝 [DRY RUN] Seria criado OrganizationMember (role: OWNER)`);
      }

      results.push({
        userId: user.user_id,
        email: user.email,
        organizationId: user.legacy_org_id,
        action: dryRun ? 'skipped' : 'created'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.log(`   ❌ Erro: ${errorMessage}`);
      results.push({
        userId: user.user_id,
        email: user.email,
        organizationId: user.legacy_org_id,
        action: 'error',
        error: errorMessage
      });
    }

    console.log('');
  }

  return results;
}

async function fixOrphanOrganizations(dryRun: boolean = false) {
  console.log(`🔧 Verificando organizações sem owner válido${dryRun ? ' (DRY RUN)' : ''}...\n`);

  // Buscar organizações sem owner válido
  const orphanOrgs = await prisma.$queryRaw<Array<{
    org_id: string;
    org_name: string;
    owner_id: string;
  }>>`
    SELECT 
      o.id as org_id,
      o.name as org_name,
      o.owner_id
    FROM organizations o
    LEFT JOIN users u ON u.id = o.owner_id
    LEFT JOIN organization_members om ON om.organization_id = o.id AND om.user_id = o.owner_id
    WHERE u.id IS NULL OR om.id IS NULL
  `;

  console.log(`📊 Encontradas ${orphanOrgs.length} organização(ões) com problema de owner\n`);

  for (const org of orphanOrgs) {
    console.log(`🏢 Organização: ${org.org_name} (${org.org_id})`);
    console.log(`   Owner atual: ${org.owner_id || 'null'}`);

    // Tentar encontrar um membro para ser o novo owner
    const members = await prisma.$queryRaw<Array<{ user_id: string; email: string }>>`
      SELECT u.id as user_id, u.email
      FROM users u
      JOIN organization_members om ON om.user_id = u.id
      WHERE om.organization_id = ${org.org_id}::uuid
      ORDER BY om.created_at ASC
      LIMIT 1
    `;

    if (members.length > 0) {
      console.log(`   Novo owner encontrado: ${members[0].email}`);
      
      if (!dryRun) {
        await prisma.$executeRaw`
          UPDATE organizations 
          SET owner_id = ${members[0].user_id}::uuid
          WHERE id = ${org.org_id}::uuid
        `;
        console.log(`   ✅ Owner atualizado`);
      } else {
        console.log(`   📝 [DRY RUN] Seria atualizado owner para ${members[0].user_id}`);
      }
    } else {
      console.log(`   ⚠️  Nenhum membro encontrado para esta organização!`);
    }
    console.log('');
  }
}

async function validateAfterMigration() {
  console.log('\n📋 Validação pós-migração:\n');

  const stats = await prisma.$queryRaw<[{ total_users: bigint; orphaned_users: bigint; valid_memberships: bigint }]>`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN om.id IS NULL THEN 1 END) as orphaned_users,
      COUNT(CASE WHEN om.id IS NOT NULL THEN 1 END) as valid_memberships
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id
  `;

  console.log('Estatísticas:');
  console.log(`  Total de usuários: ${stats[0].total_users}`);
  console.log(`  Usuários órfãos: ${stats[0].orphaned_users}`);
  console.log(`  Memberships válidos: ${stats[0].valid_memberships}`);

  if (stats[0].orphaned_users > 0) {
    console.log('\n⚠️  Ainda existem usuários órfãos!');
    
    const remaining = await prisma.$queryRaw<Array<{ email: string; organization_id: string }>>`
      SELECT u.email, u.organization_id
      FROM users u
      LEFT JOIN organization_members om ON om.user_id = u.id
      WHERE om.id IS NULL
    `;
    
    for (const user of remaining) {
      console.log(`  - ${user.email} (org: ${user.organization_id || 'null'})`);
    }
    
    return false;
  }

  console.log('\n✅ Todos os usuários têm OrganizationMember!');
  return true;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  if (dryRun) {
    console.log('========================================');
    console.log('📝 MODO DRY RUN - Nenhuma alteração será feita');
    console.log('========================================\n');
  }

  try {
    // 1. Migrar usuários órfãos
    const migrationResults = await migrateOrgMembers(dryRun);
    
    // 2. Corrigir organizações sem owner
    await fixOrphanOrganizations(dryRun);
    
    // 3. Validar resultado (se não for dry-run)
    if (!dryRun && migrationResults.length > 0) {
      const isValid = await validateAfterMigration();
      
      if (!isValid) {
        console.log('\n❌ Migração incompleta - ainda existem usuários órfãos');
        process.exit(1);
      }
    }

    // Resumo
    console.log('\n📊 RESUMO DA MIGRAÇÃO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const created = migrationResults.filter(r => r.action === 'created').length;
    const skipped = migrationResults.filter(r => r.action === 'skipped').length;
    const errors = migrationResults.filter(r => r.action === 'error').length;
    
    console.log(`Total processado: ${migrationResults.length}`);
    console.log(`Criados: ${created}`);
    console.log(`Ignorados (dry-run): ${skipped}`);
    console.log(`Erros: ${errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (errors > 0) {
      console.log('\n❌ Erros encontrados:');
      for (const result of migrationResults.filter(r => r.action === 'error')) {
        console.log(`  - ${result.email}: ${result.error}`);
      }
      process.exit(1);
    }

    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
