#!/usr/bin/env tsx
/**
 * FASE 0 - Auditoria do Banco de Dados
 * Diagnostico e Reconciliacao da Migracao
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  log: ['error'],
});

interface AuditResult {
  timestamp: string;
  databaseHost: string;
  tables: any[];
  usersWithOrganizationId: any[];
  orphanedUsers: any[];
  rlsStatus: any[];
  policies: any[];
  uniqueConstraints: any[];
  recordCounts: any[];
  userMembershipStats: any;
  orgsWithoutValidOwner: any[];
}

async function runAudit(): Promise<AuditResult> {
  console.log('🔍 Iniciando auditoria do banco de dados...\n');

  // 0.1 Listar todas as tabelas
  console.log('📋 0.1 - Listando tabelas...');
  const tables = await prisma.$queryRaw`
    SELECT 
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log(`   ${(tables as any[]).length} tabelas encontradas`);

  // 0.2 Verificar coluna users.organization_id
  console.log('📋 0.2 - Verificando coluna users.organization_id...');
  const usersWithOrganizationId = await prisma.$queryRaw`
    SELECT 
      column_name, 
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'organization_id'
  `;
  console.log(`   ${(usersWithOrganizationId as any[]).length} coluna(s) organization_id encontrada(s)`);

  // 0.3 Auditar usuarios sem OrganizationMember
  console.log('📋 0.3 - Auditando usuarios sem OrganizationMember...');
  const orphanedUsers = await prisma.$queryRaw`
    SELECT 
      u.id as user_id, 
      u.email, 
      u.organization_id as legacy_org_id,
      u.name,
      u.created_at
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL
  `;
  console.log(`   ${(orphanedUsers as any[]).length} usuario(s) orfao(s) encontrado(s)`);

  // 0.4 Verificar RLS
  console.log('📋 0.4 - Verificando status RLS...');
  const rlsStatus = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      rowsecurity as rls_enabled,
      (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = pg_tables.schemaname AND p.tablename = pg_tables.tablename) as policy_count
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const rlsEnabledCount = (rlsStatus as any[]).filter(t => t.rls_enabled).length;
  console.log(`   ${rlsEnabledCount} tabela(s) com RLS ativo`);

  // 0.5 Verificar politicas RLS
  console.log('📋 0.5 - Verificando politicas RLS...');
  const policies = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles::text,
      cmd,
      qual as using_expression,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;
  console.log(`   ${(policies as any[]).length} politica(s) encontrada(s)`);

  // 0.6 Verificar constraints unique
  console.log('📋 0.6 - Verificando constraints unique...');
  const uniqueConstraints = await prisma.$queryRaw`
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE' 
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `;
  console.log(`   ${(uniqueConstraints as any[]).length} constraint(s) unique encontrada(s)`);

  // 0.7 Contar registros
  console.log('📋 0.7 - Contando registros...');
  const recordCounts = await prisma.$queryRaw`
    SELECT 'contacts' as table_name, COUNT(*) as count FROM contacts
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
    UNION ALL SELECT 'organization_members', COUNT(*) FROM organization_members
    UNION ALL SELECT 'deals', COUNT(*) FROM deals
    UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
    UNION ALL SELECT 'messages', COUNT(*) FROM messages
    UNION ALL SELECT 'whatsapp_cloud_instances', COUNT(*) FROM whatsapp_cloud_instances
    ORDER BY table_name
  `;
  console.log(`   Contagens obtidas para ${(recordCounts as any[]).length} tabela(s)`);

  // 0.8 Estatisticas de membership
  console.log('📋 0.8 - Calculando estatisticas de membership...');
  const userMembershipStats = await prisma.$queryRaw`
    SELECT 
      COUNT(*) as total_users,
      COUNT(u.organization_id) as users_with_legacy_org,
      COUNT(om.id) as users_with_membership,
      COUNT(u.organization_id) - COUNT(om.id) as orphaned_users
    FROM users u
    LEFT JOIN organization_members om ON om.user_id = u.id
  `;
  console.log(`   Estatisticas calculadas`);

  // 0.9 Verificar organizacoes sem owner valido
  console.log('📋 0.9 - Verificando organizacoes sem owner valido...');
  const orgsWithoutValidOwner = await prisma.$queryRaw`
    SELECT 
      o.id as org_id,
      o.name as org_name,
      o.owner_id,
      u.id as user_exists,
      om.user_id as has_membership
    FROM organizations o
    LEFT JOIN users u ON u.id = o.owner_id
    LEFT JOIN organization_members om ON om.organization_id = o.id AND om.user_id = o.owner_id
    WHERE u.id IS NULL OR om.id IS NULL
  `;
  console.log(`   ${(orgsWithoutValidOwner as any[]).length} org(s) com problema de owner`);

  return {
    timestamp: new Date().toISOString(),
    databaseHost: '49.13.228.89:5432',
    tables: tables as any[],
    usersWithOrganizationId: usersWithOrganizationId as any[],
    orphanedUsers: orphanedUsers as any[],
    rlsStatus: rlsStatus as any[],
    policies: policies as any[],
    uniqueConstraints: uniqueConstraints as any[],
    recordCounts: recordCounts as any[],
    userMembershipStats: (userMembershipStats as any[])[0],
    orgsWithoutValidOwner: orgsWithoutValidOwner as any[],
  };
}

function generateDivergenciasDoc(result: AuditResult): string {
  const lines: string[] = [];
  
  lines.push('# Divergencias Schema Prisma vs Banco Real');
  lines.push('');
  lines.push(`> **Data:** ${new Date(result.timestamp).toLocaleString('pt-BR')}`);
  lines.push(`> **Banco:** ${result.databaseHost}`);
  lines.push(`> **Gerado por:** scripts/fase0-auditoria.ts`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Resumo Executivo');
  lines.push('');
  lines.push('| Metrica | Valor |');
  lines.push('|---------|-------|');
  lines.push(`| Total de Tabelas | ${result.tables.length} |`);
  lines.push(`| Tabelas com RLS Ativo | ${result.rlsStatus.filter((t: any) => t.rls_enabled).length} |`);
  lines.push(`| Usuarios Orfaos (sem OrganizationMember) | ${result.orphanedUsers.length} |`);
  lines.push(`| Organizacoes com Owner Invalido | ${result.orgsWithoutValidOwner.length} |`);
  lines.push(`| Politicas RLS Existentes | ${result.policies.length} |`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Coluna users.organization_id');
  lines.push('');
  lines.push(`**Status:** ${result.usersWithOrganizationId.length > 0 ? '✅ EXISTE' : '❌ NAO EXISTE'}`);
  lines.push('');
  
  if (result.usersWithOrganizationId.length > 0) {
    lines.push('A coluna `organization_id` existe no banco de dados real, mas **NAO esta modelada no Prisma schema** atual.');
    lines.push('');
    lines.push('**Detalhes:**');
    lines.push('```json');
    lines.push(JSON.stringify(result.usersWithOrganizationId, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('**Acao necessaria:**');
    lines.push('Adicionar ao model User em `prisma/schema.prisma`:');
    lines.push('```prisma');
    lines.push('model User {');
    lines.push('  // ... campos existentes');
    lines.push('  organizationId String? @map("organization_id") @db.Uuid');
    lines.push('  legacyOrganization   Organization? @relation("LegacyUserOrganization", fields: [organizationId], references: [id])');
    lines.push('}');
    lines.push('```');
  } else {
    lines.push('A coluna nao existe no banco.');
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 2. Tabelas no Banco vs Prisma Schema');
  lines.push('');
  lines.push(`### Tabelas existentes no banco (${result.tables.length}):`);
  lines.push('');
  lines.push('| Tabela | Colunas | RLS Ativo | Politicas |');
  lines.push('|--------|---------|-----------|-----------|');
  
  for (const t of result.tables) {
    const rlsInfo = result.rlsStatus.find((r: any) => r.tablename === t.table_name);
    lines.push(`| ${t.table_name} | ${t.column_count} | ${rlsInfo?.rls_enabled ? '✅' : '❌'} | ${rlsInfo?.policy_count || 0} |`);
  }
  
  lines.push('');
  lines.push('### Divergencias Identificadas:');
  lines.push('');
  lines.push(compareTablesWithPrisma(result));
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 3. Row Level Security (RLS)');
  lines.push('');
  lines.push('### Status por Tabela:');
  lines.push('');
  lines.push('| Tabela | RLS Ativo | Politicas | Observacao |');
  lines.push('|--------|-----------|-----------|------------|');
  
  for (const t of result.rlsStatus) {
    lines.push(`| ${t.tablename} | ${t.rls_enabled ? '✅' : '❌'} | ${t.policy_count} | ${getRlsObservation(t.tablename, t.rls_enabled)} |`);
  }
  
  lines.push('');
  lines.push('### Politicas Existentes:');
  lines.push('');
  
  if (result.policies.length > 0) {
    for (const p of result.policies) {
      lines.push(`- **${p.tablename}.${p.policyname}**: ${p.cmd} (${p.permissive})`);
    }
  } else {
    lines.push('**Nenhuma politica RLS configurada ainda.**');
  }
  
  lines.push('');
  lines.push('**Acao necessaria:** Configurar RLS em todas as tabelas de dados conforme Fase 2 do plano.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 4. Usuarios Orfaos (sem OrganizationMember)');
  lines.push('');
  lines.push(`**Total de usuarios orfaos:** ${result.orphanedUsers.length}`);
  lines.push('');
  
  if (result.orphanedUsers.length > 0) {
    lines.push('Estes usuarios tem `organization_id` legado mas nao tem registro em `organization_members`:');
    lines.push('');
    lines.push('| User ID | Email | Legacy Org ID | Nome | Criado em |');
    lines.push('|---------|-------|---------------|------|-----------|');
    
    for (const u of result.orphanedUsers) {
      const shortId = u.user_id.substring(0, 8) + '...';
      const shortOrgId = u.legacy_org_id ? u.legacy_org_id.substring(0, 8) + '...' : 'null';
      const date = new Date(u.created_at).toLocaleDateString('pt-BR');
      lines.push(`| ${shortId} | ${u.email} | ${shortOrgId} | ${u.name || '-'} | ${date} |`);
    }
    
    lines.push('');
    lines.push('**Acao necessaria:** Executar script `scripts/migrate-org-members.ts` para criar OrganizationMember para cada usuario orfao.');
  } else {
    lines.push('✅ Todos os usuarios tem OrganizationMember associado.');
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 5. Estatisticas de Membership');
  lines.push('');
  lines.push('| Metrica | Valor |');
  lines.push('|---------|-------|');
  lines.push(`| Total de Usuarios | ${result.userMembershipStats?.total_users || 0} |`);
  lines.push(`| Usuarios com organization_id legado | ${result.userMembershipStats?.users_with_legacy_org || 0} |`);
  lines.push(`| Usuarios com Membership | ${result.userMembershipStats?.users_with_membership || 0} |`);
  lines.push(`| Usuarios Orfaos | ${result.userMembershipStats?.orphaned_users || 0} |`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 6. Organizacoes com Problemas de Owner');
  lines.push('');
  
  if (result.orgsWithoutValidOwner.length > 0) {
    lines.push(`**${result.orgsWithoutValidOwner.length} organizacao(oes)** sem owner valido:`);
    lines.push('');
    lines.push('| Org ID | Nome | Owner ID | User Existe? | Tem Membership? |');
    lines.push('|--------|------|----------|--------------|-----------------|');
    
    for (const o of result.orgsWithoutValidOwner) {
      const shortOrgId = o.org_id.substring(0, 8) + '...';
      const shortOwnerId = o.owner_id ? o.owner_id.substring(0, 8) + '...' : 'null';
      lines.push(`| ${shortOrgId} | ${o.org_name} | ${shortOwnerId} | ${o.user_exists ? '✅' : '❌'} | ${o.has_membership ? '✅' : '❌'} |`);
    }
  } else {
    lines.push('✅ Todas as organizacoes tem owner valido com membership.');
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 7. Volumes de Dados');
  lines.push('');
  lines.push('| Tabela | Registros |');
  lines.push('|--------|-----------|');
  
  for (const r of result.recordCounts) {
    lines.push(`| ${r.table_name} | ${r.count} |`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 8. Constraints Unique (potenciais problemas de soft-delete)');
  lines.push('');
  
  const criticalConstraints = result.uniqueConstraints.filter((c: any) => ['contacts', 'users', 'organizations'].includes(c.table_name));
  if (criticalConstraints.length > 0) {
    for (const c of criticalConstraints) {
      lines.push(`- **${c.table_name}.${c.constraint_name}**: ${c.column_name}`);
    }
  } else {
    lines.push('Nenhuma constraint unique em tabelas criticas.');
  }
  
  lines.push('');
  lines.push('**Nota:** Constraints unique em tabelas com soft-delete podem causar problemas ao tentar recriar registros deletados.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Checklist de Acoes');
  lines.push('');
  lines.push('- [ ] Adicionar `organizationId` ao model User no Prisma schema');
  lines.push('- [ ] Executar script de migracao para usuarios orfaos');
  lines.push('- [ ] Criar migrations para sincronizar schema');
  lines.push('- [ ] Configurar RLS em todas as tabelas de dados (Fase 2)');
  lines.push('- [ ] Corrigir organizacoes sem owner valido (se houver)');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Documento gerado automaticamente pelo script de auditoria da Fase 0.*');
  
  return lines.join('\n');
}

function compareTablesWithPrisma(result: AuditResult): string {
  const expectedPrismaTables = [
    'organizations', 'organization_members', 'organization_units', 'users',
    'whatsapp_cloud_instances', 'whatsapp_cloud_templates', 'whatsapp_cloud_logs',
    'contacts', 'conversations', 'messages', 'instagram_instances',
    'pipeline_stages', 'deals', 'pipeline_stage_history', 'monthly_goals',
    'dashboard_metric_cache', 'deal_activities', 'meta_webhook_logs',
    'schedules', 'tags', 'contact_tags', 'lists', 'list_contacts',
    'custom_field_definitions', 'contact_custom_field_values', 'segments',
    'pipeline_templates', 'pipeline_template_stages', 'ai_insights',
    'transcriptions', 'integrations', 'integration_configs', 'integration_activity_logs',
    'plans', 'subscriptions', 'invoices', 'charges', 'coupons', 'pending_form_deliveries'
  ];

  const dbTables = result.tables.map((t: any) => t.table_name);
  const extraInDb = dbTables.filter((t: string) => !expectedPrismaTables.includes(t));
  const missingInDb = expectedPrismaTables.filter((t: string) => !dbTables.includes(t));

  const output: string[] = [];
  
  if (extraInDb.length > 0) {
    output.push(`\n**Tabelas no banco mas nao no Prisma schema (${extraInDb.length}):**\n`);
    for (const t of extraInDb) {
      output.push(`- \`${t}\``);
    }
    output.push('');
  }
  
  if (missingInDb.length > 0) {
    output.push(`\n**Tabelas esperadas no Prisma mas nao encontradas no banco (${missingInDb.length}):**\n`);
    for (const t of missingInDb) {
      output.push(`- \`${t}\``);
    }
    output.push('');
  }

  if (extraInDb.length === 0 && missingInDb.length === 0) {
    output.push('\n✅ Todas as tabelas estao sincronizadas entre Prisma e banco.\n');
  }

  return output.join('\n');
}

function getRlsObservation(tableName: string, enabled: boolean): string {
  const criticalTables = ['contacts', 'deals', 'conversations', 'messages', 'organization_members', 'organizations'];
  if (criticalTables.includes(tableName)) {
    return enabled ? '✅ Protegida' : '🔴 CRITICO: Dados sensiveis sem RLS';
  }
  return enabled ? 'Ativo' : 'Inativo';
}

async function main() {
  try {
    const result = await runAudit();
    
    const docContent = generateDivergenciasDoc(result);
    const docPath = path.join(process.cwd(), 'docs', 'backend', 'divergencias-schema.md');
    
    fs.mkdirSync(path.dirname(docPath), { recursive: true });
    fs.writeFileSync(docPath, docContent, 'utf-8');
    console.log(`\n✅ Documento gerado: ${docPath}`);

    const jsonPath = path.join(process.cwd(), 'docs', 'backend', 'divergencias-schema.json');
    const jsonContent = JSON.stringify(result, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2
    );
    fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
    console.log(`✅ Dados brutos: ${jsonPath}`);

    console.log('\n📊 RESUMO DA AUDITORIA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Tabelas no banco: ${result.tables.length}`);
    console.log(`Usuarios orfaos: ${result.orphanedUsers.length}`);
    console.log(`Tabelas com RLS: ${result.rlsStatus.filter((t: any) => t.rls_enabled).length}`);
    console.log(`Politicas RLS: ${result.policies.length}`);
    console.log(`Orgs sem owner valido: ${result.orgsWithoutValidOwner.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (result.orphanedUsers.length > 0 || result.orgsWithoutValidOwner.length > 0) {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS - Requerem atencao!');
      process.exit(1);
    } else {
      console.log('\n✅ Auditoria concluida sem problemas criticos.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Erro na auditoria:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
