-- ============================================================
-- REGISTRAR MIGRATION NO PRISMA
-- Execute APÓS executar o supabase-migration-pipeline.sql
-- Isso evita que o Prisma tente aplicar a migration novamente
-- ============================================================

-- Inserir registro na tabela de controle do Prisma
INSERT INTO "_prisma_migrations" (
    "id", 
    "checksum", 
    "finished_at", 
    "migration_name", 
    "logs", 
    "rolled_back_at", 
    "started_at", 
    "applied_steps_count"
)
VALUES (
    gen_random_uuid(),
    '',
    NOW(),
    'add_pipeline_templates',
    '',
    NULL,
    NOW(),
    1
)
ON CONFLICT ("migration_name") DO NOTHING;

-- Verificar se foi registrado
SELECT * FROM "_prisma_migrations" WHERE "migration_name" = 'add_pipeline_templates';
