#!/usr/bin/env tsx
/**
 * Script de migração do banco de dados
 * Usa Prisma para aplicar migrations
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração do banco de dados...\n');

  try {
    // 1. Verificar conexão
    console.log('📡 Verificando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!\n');

    // 2. Aplicar migrations do Prisma
    console.log('🔄 Aplicando migrations do Prisma...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      console.log('⚠️  Migrate deploy falhou, tentando db push...');
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    }

    // 3. Gerar Prisma Client
    console.log('\n🔧 Gerando Prisma Client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // 4. Verificar tabelas criadas
    console.log('\n📊 Verificando tabelas criadas...');
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log('📋 Tabelas encontradas:');
    (tables as any[]).forEach((t) => console.log(`   - ${t.tablename}`));

    // 5. Seed dados iniciais (se necessário)
    console.log('\n🌱 Verificando seed data...');
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('   Nenhum usuário encontrado. Execute: pnpm db:seed');
    } else {
      console.log(`   ${userCount} usuários encontrados.`);
    }

    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
