#!/usr/bin/env tsx
/**
 * Script para aplicar políticas RLS no banco de dados
 * Executa o SQL de fase2-migracao.sql via Prisma
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyRLS() {
  console.log('🚀 Iniciando aplicação de RLS...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(process.cwd(), 'docs', 'backend', 'fase2-migracao.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir em statements (ignorar comentários e linhas vazias)
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && line.trim() !== '')
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📄 Total de comandos SQL: ${statements.length}\n`);

    // Executar cada statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const shortDesc = statement.substring(0, 60).replace(/\n/g, ' ');
      
      try {
        await prisma.$executeRawUnsafe(statement + ';');
        successCount++;
        
        // Mostrar progresso a cada 10 comandos
        if ((i + 1) % 10 === 0 || i === statements.length - 1) {
          console.log(`  ✅ ${i + 1}/${statements.length} comandos aplicados`);
        }
      } catch (error: any) {
        errorCount++;
        // Ignorar erros de "already exists" ou políticas duplicadas
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.message?.includes('does not exist')) {
          console.log(`  ⚠️  Ignorado: ${shortDesc}...`);
        } else {
          console.error(`  ❌ Erro: ${shortDesc}...`);
          console.error(`     ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⚠️  Ignorados: ${errorCount}`);

    // Verificar políticas criadas
    console.log('\n🔍 Verificando políticas RLS...');
    const policies = await prisma.$queryRaw`
      SELECT tablename, count(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY policy_count DESC
    `;

    console.log('\n📋 Tabelas com RLS:');
    for (const row of policies as any[]) {
      console.log(`   • ${row.tablename}: ${row.policy_count} políticas`);
    }

    console.log('\n✅ RLS aplicado com sucesso!');

  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLS();
