/**
 * Script para executar a migration de automações diretamente no banco
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = `
-- Criação das tabelas de automação (se não existirem)

-- Criar enums (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationTriggerType') THEN
        CREATE TYPE "AutomationTriggerType" AS ENUM ('STAGE_ENTRY', 'STAGE_EXIT', 'DEAL_CREATED', 'DEAL_UPDATED');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationActionType') THEN
        CREATE TYPE "AutomationActionType" AS ENUM ('MOVE', 'COPY', 'CREATE');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationStatus') THEN
        CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationLogStatus') THEN
        CREATE TYPE "AutomationLogStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');
    END IF;
END$$;

-- Criar tabela pipeline_automations (se não existir)
CREATE TABLE IF NOT EXISTS "pipeline_automations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "trigger_type" "AutomationTriggerType" NOT NULL DEFAULT 'STAGE_ENTRY',
    "trigger_stage_id" UUID,
    "action_type" "AutomationActionType" NOT NULL DEFAULT 'MOVE',
    "target_pipeline_id" UUID NOT NULL,
    "target_stage_id" UUID NOT NULL,
    "conditions" JSONB,
    "action_config" JSONB,
    "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_execution_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_automations_pkey" PRIMARY KEY ("id")
);

-- Criar tabela automation_logs (se não existir)
CREATE TABLE IF NOT EXISTS "automation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "automation_id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "trigger_stage_id" UUID,
    "status" "AutomationLogStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "pipeline_automations_organization_id_idx" ON "pipeline_automations"("organization_id");
CREATE INDEX IF NOT EXISTS "pipeline_automations_organization_id_is_active_idx" ON "pipeline_automations"("organization_id", "is_active");
CREATE INDEX IF NOT EXISTS "pipeline_automations_trigger_stage_id_trigger_type_idx" ON "pipeline_automations"("trigger_stage_id", "trigger_type");

CREATE INDEX IF NOT EXISTS "automation_logs_organization_id_deal_id_idx" ON "automation_logs"("organization_id", "deal_id");
CREATE INDEX IF NOT EXISTS "automation_logs_automation_id_idx" ON "automation_logs"("automation_id");
CREATE INDEX IF NOT EXISTS "automation_logs_started_at_idx" ON "automation_logs"("started_at" DESC);
`;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente');
    console.error('Certifique-se de ter um arquivo .env.local com a DATABASE_URL configurada');
    process.exit(1);
  }

  console.log('🔌 Conectando ao banco de dados...');
  
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    console.log('📝 Executando migration...');
    await client.query(sql);
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%automation%'
    `);
    
    console.log('\n📊 Tabelas de automação encontradas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
