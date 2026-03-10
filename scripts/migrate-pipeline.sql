-- ============================================
-- Migração: Pipeline CRM Tables
-- Execute este script no PostgreSQL da VPS
-- ============================================

-- ============================================
-- 1. ENUM Types
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealStatus') THEN
        CREATE TYPE "DealStatus" AS ENUM ('ACTIVE', 'WON', 'LOST', 'ARCHIVED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealPriority') THEN
        CREATE TYPE "DealPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
        CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK', 'WHATSAPP', 'SYSTEM');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationStatus') THEN
        CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
END
$$;

-- ============================================
-- 2. Pipeline Stages Table
-- ============================================

CREATE TABLE IF NOT EXISTS "PipelineStage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "position" INTEGER NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PipelineStage_organizationId_idx" ON "PipelineStage"("organizationId");
CREATE INDEX IF NOT EXISTS "PipelineStage_position_idx" ON "PipelineStage"("position");

-- Trigger para atualizar updatedAt
CREATE OR REPLACE FUNCTION update_pipeline_stage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pipeline_stage_updated_at ON "PipelineStage";
CREATE TRIGGER update_pipeline_stage_updated_at
    BEFORE UPDATE ON "PipelineStage"
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_stage_updated_at();

-- ============================================
-- 3. Deals Table
-- ============================================

CREATE TABLE IF NOT EXISTS "Deal" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "priority" "DealPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DealStatus" NOT NULL DEFAULT 'ACTIVE',
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Deal_organizationId_idx" ON "Deal"("organizationId");
CREATE INDEX IF NOT EXISTS "Deal_stageId_idx" ON "Deal"("stageId");
CREATE INDEX IF NOT EXISTS "Deal_contactId_idx" ON "Deal"("contactId");
CREATE INDEX IF NOT EXISTS "Deal_status_idx" ON "Deal"("status");

DROP TRIGGER IF EXISTS update_deal_updated_at ON "Deal";
CREATE TRIGGER update_deal_updated_at
    BEFORE UPDATE ON "Deal"
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_stage_updated_at();

-- ============================================
-- 4. Deal Activities Table
-- ============================================

CREATE TABLE IF NOT EXISTS "DealActivity" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "dealId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL DEFAULT 'NOTE',
    "title" TEXT,
    "content" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealActivity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DealActivity_dealId_idx" ON "DealActivity"("dealId");
CREATE INDEX IF NOT EXISTS "DealActivity_type_idx" ON "DealActivity"("type");

-- ============================================
-- 5. Pipeline Templates (Opcional)
-- ============================================

CREATE TABLE IF NOT EXISTS "PipelineTemplate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PipelineTemplate_category_idx" ON "PipelineTemplate"("category");

CREATE TABLE IF NOT EXISTS "PipelineTemplateStage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "position" INTEGER NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PipelineTemplateStage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PipelineTemplateStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PipelineTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PipelineTemplateStage_templateId_idx" ON "PipelineTemplateStage"("templateId");

-- ============================================
-- 6. Inserir Templates Padrão
-- ============================================

-- Template: Infoprodutos
INSERT INTO "PipelineTemplate" ("id", "name", "category", "description") 
VALUES ('infoprodutos-v1', 'Pipeline de Infoprodutos', 'infoprodutos', 'Processo completo de vendas para cursos, mentorias e produtos digitais')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PipelineTemplateStage" ("templateId", "name", "position", "color", "probability", "isDefault", "isClosed") VALUES
('infoprodutos-v1', 'Lead Capturado', 0, '#94a3b8', 10, true, false),
('infoprodutos-v1', 'Lead Engajado', 1, '#60a5fa', 20, false, false),
('infoprodutos-v1', 'Lead Qualificado', 2, '#3b82f6', 35, false, false),
('infoprodutos-v1', 'Oportunidade', 3, '#8b5cf6', 50, false, false),
('infoprodutos-v1', 'Negociação', 4, '#f59e0b', 70, false, false),
('infoprodutos-v1', 'Convertido', 5, '#22c55e', 100, false, true),
('infoprodutos-v1', 'Perdido', 6, '#ef4444', 0, false, true),
('infoprodutos-v1', 'Cliente Ativo', 7, '#10b981', 100, false, false),
('infoprodutos-v1', 'Upsell', 8, '#06b6d4', 80, false, false),
('infoprodutos-v1', 'Inativo', 9, '#6b7280', 0, false, true);

-- Template: Negócios Físicos
INSERT INTO "PipelineTemplate" ("id", "name", "category", "description") 
VALUES ('negocios-fisicos-v1', 'Pipeline de Negócios Físicos', 'negocios-fisicos', 'Processo de vendas para lojas, serviços locais e comércio físico')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PipelineTemplateStage" ("templateId", "name", "position", "color", "probability", "isDefault", "isClosed") VALUES
('negocios-fisicos-v1', 'Lead Capturado', 0, '#94a3b8', 10, true, false),
('negocios-fisicos-v1', 'Primeiro Contato', 1, '#60a5fa', 25, false, false),
('negocios-fisicos-v1', 'Orçamento', 2, '#3b82f6', 40, false, false),
('negocios-fisicos-v1', 'Visita', 3, '#8b5cf6', 55, false, false),
('negocios-fisicos-v1', 'Negociação', 4, '#f59e0b', 75, false, false),
('negocios-fisicos-v1', 'Convertido', 5, '#22c55e', 100, false, true),
('negocios-fisicos-v1', 'Perdido', 6, '#ef4444', 0, false, true),
('negocios-fisicos-v1', 'Cliente Recorrente', 7, '#10b981', 100, false, false),
('negocios-fisicos-v1', 'Promotor', 8, '#14b8a6', 100, false, false),
('negocios-fisicos-v1', 'Inativo', 9, '#6b7280', 0, false, true);

-- Template: Saúde
INSERT INTO "PipelineTemplate" ("id", "name", "category", "description") 
VALUES ('saude-v1', 'Pipeline de Saúde', 'saude', 'Processo de atendimento para clínicas e consultórios')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PipelineTemplateStage" ("templateId", "name", "position", "color", "probability", "isDefault", "isClosed") VALUES
('saude-v1', 'Lead Capturado', 0, '#94a3b8', 10, true, false),
('saude-v1', 'Triagem', 1, '#60a5fa', 30, false, false),
('saude-v1', 'Agendamento', 2, '#818cf8', 50, false, false),
('saude-v1', 'Avaliação', 3, '#8b5cf6', 65, false, false),
('saude-v1', 'Decisão', 4, '#f59e0b', 80, false, false),
('saude-v1', 'Tratamento Iniciado', 5, '#22c55e', 100, false, true),
('saude-v1', 'Em Tratamento', 6, '#10b981', 100, false, false),
('saude-v1', 'Concluído', 7, '#14b8a6', 100, false, true),
('saude-v1', 'Recorrente', 8, '#06b6d4', 100, false, false),
('saude-v1', 'Perdido', 9, '#6b7280', 0, false, true);

-- ============================================
-- 7. Confirmar migração
-- ============================================

SELECT 'Pipeline tables created successfully!' as status;
