-- Sprint 4: Migration para tabelas de Integrações
-- Execute no SQL Editor do Supabase

-- ============================================
-- TABELA: integrations
-- ============================================
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "config" JSONB,
    "connected_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- Indexes para integrations
CREATE INDEX IF NOT EXISTS "integrations_organization_id_idx" ON "integrations"("organization_id");
CREATE INDEX IF NOT EXISTS "integrations_status_idx" ON "integrations"("status");
CREATE INDEX IF NOT EXISTS "integrations_type_idx" ON "integrations"("type");

-- Foreign Key para organizations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'integrations_organization_id_fkey'
    ) THEN
        ALTER TABLE "integrations" 
            ADD CONSTRAINT "integrations_organization_id_fkey" 
            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- TABELA: integration_configs
-- ============================================
CREATE TABLE IF NOT EXISTS "integration_configs" (
    "id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- Indexes para integration_configs
CREATE INDEX IF NOT EXISTS "integration_configs_integration_id_idx" ON "integration_configs"("integration_id");
CREATE UNIQUE INDEX IF NOT EXISTS "integration_configs_integration_id_key_idx" ON "integration_configs"("integration_id", "key");

-- Foreign Key para integrations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'integration_configs_integration_id_fkey'
    ) THEN
        ALTER TABLE "integration_configs" 
            ADD CONSTRAINT "integration_configs_integration_id_fkey" 
            FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- SEED: Integrações padrão
-- ============================================
INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'zapier',
    'Zapier',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'n8n',
    'N8N',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'make',
    'Make (Integromat)',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'google_sheets',
    'Google Sheets',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'slack',
    'Slack',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

INSERT INTO "integrations" ("id", "organization_id", "type", "name", "status", "config", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    o.id,
    'typebot',
    'Typebot',
    'inactive',
    '{}',
    NOW(),
    NOW()
FROM "organizations" o
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Tabela integrations criada com sucesso' as status;
SELECT COUNT(*) as total_integrations FROM "integrations";
