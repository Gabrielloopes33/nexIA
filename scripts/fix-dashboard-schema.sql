-- ============================================================
-- Script de correção do schema do dashboard
-- Execute este script no SQL Editor do Supabase Studio
-- ============================================================

-- 1. Criar enum ChannelType (com todos os valores do schema Prisma)
DO $$ BEGIN
    CREATE TYPE "ChannelType" AS ENUM (
        'WHATSAPP_OFFICIAL',
        'WHATSAPP_UNOFFICIAL',
        'INSTAGRAM',
        'FACEBOOK',
        'EMAIL',
        'PHONE',
        'FORM',
        'WEBSITE',
        'LANDING_PAGE',
        'MANUAL',
        'API',
        'CHATBOT',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Enum ChannelType já existe, pulando criação.';
END $$;

-- 2. Adicionar coluna lead_score na tabela deals
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "lead_score" INTEGER NOT NULL DEFAULT 0;

-- 3. Adicionar coluna lost_reason na tabela deals (TEXT, não enum)
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "lost_reason" TEXT;

-- Renomear "lostReason" para "lost_reason" se existir com o nome errado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'lostReason'
    ) THEN
        ALTER TABLE "deals" RENAME COLUMN "lostReason" TO "lost_reason_old";
        -- Se lost_reason já existia vazia, copiar os dados
        UPDATE "deals" SET "lost_reason" = "lost_reason_old" WHERE "lost_reason" IS NULL AND "lost_reason_old" IS NOT NULL;
        ALTER TABLE "deals" DROP COLUMN "lost_reason_old";
        RAISE NOTICE 'Coluna lostReason renomeada para lost_reason.';
    END IF;
END $$;

-- 4. Corrigir coluna channel
-- Se existir como varchar, converter para enum ChannelType
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals'
          AND column_name = 'channel'
          AND data_type = 'character varying'
    ) THEN
        -- Definir valores inválidos como 'OTHER' antes de converter
        UPDATE "deals" SET "channel" = 'OTHER'
        WHERE "channel" NOT IN (
            'WHATSAPP_OFFICIAL', 'WHATSAPP_UNOFFICIAL', 'INSTAGRAM',
            'FACEBOOK', 'EMAIL', 'PHONE', 'FORM', 'WEBSITE',
            'LANDING_PAGE', 'MANUAL', 'API', 'CHATBOT', 'OTHER'
        ) OR "channel" IS NULL;

        ALTER TABLE "deals"
            ALTER COLUMN "channel" TYPE "ChannelType"
            USING "channel"::"ChannelType";

        RAISE NOTICE 'Coluna channel convertida para enum ChannelType.';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'channel'
    ) THEN
        ALTER TABLE "deals" ADD COLUMN "channel" "ChannelType" NOT NULL DEFAULT 'OTHER';
        RAISE NOTICE 'Coluna channel adicionada como enum ChannelType.';
    ELSE
        RAISE NOTICE 'Coluna channel já está correta.';
    END IF;
END $$;

-- 5. Adicionar outras colunas ausentes na tabela deals
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "closed_lost_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "closed_won_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "lost_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "estimated_value" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "qualified_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "proposal_sent_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "negotiation_at" TIMESTAMP(3);

-- 6. Criar tabela pipeline_stage_history
CREATE TABLE IF NOT EXISTS "pipeline_stage_history" (
    "id"         TEXT NOT NULL,
    "deal_id"    TEXT NOT NULL,
    "stage"      TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exited_at"  TIMESTAMP(3),
    "duration"   INTEGER,
    CONSTRAINT "pipeline_stage_history_pkey" PRIMARY KEY ("id")
);

-- Adicionar FK se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'pipeline_stage_history_deal_id_fkey'
    ) THEN
        ALTER TABLE "pipeline_stage_history"
            ADD CONSTRAINT "pipeline_stage_history_deal_id_fkey"
            FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Recriar tabela monthly_goals com o schema correto (Prisma espera month INT, year INT)
-- Verificar se a tabela existe com schema errado (month TIMESTAMP)
DO $$
DECLARE
    month_type TEXT;
BEGIN
    SELECT data_type INTO month_type
    FROM information_schema.columns
    WHERE table_name = 'monthly_goals' AND column_name = 'month';

    IF month_type = 'timestamp without time zone' OR month_type = 'timestamp with time zone' THEN
        -- Schema errado, recriar
        DROP TABLE IF EXISTS "monthly_goals" CASCADE;
        RAISE NOTICE 'Tabela monthly_goals recriada com schema correto.';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "monthly_goals" (
    "id"              TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "month"           INTEGER NOT NULL,
    "year"            INTEGER NOT NULL,
    "revenue_goal"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deals_goal"      INTEGER NOT NULL DEFAULT 0,
    "leads_goal"      INTEGER NOT NULL DEFAULT 0,
    "conversion_goal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monthly_goals_pkey" PRIMARY KEY ("id")
);

-- 8. Criar tabela dashboard_metric_cache
CREATE TABLE IF NOT EXISTS "dashboard_metric_cache" (
    "id"              TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "metric_type"     TEXT NOT NULL,
    "period"          TEXT NOT NULL,
    "data"            JSONB NOT NULL,
    "calculated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dashboard_metric_cache_pkey" PRIMARY KEY ("id")
);

-- 9. Criar índices
CREATE INDEX IF NOT EXISTS "deals_lead_score_idx" ON "deals"("lead_score");
CREATE INDEX IF NOT EXISTS "deals_lost_reason_closed_lost_at_idx" ON "deals"("lost_reason", "closed_lost_at");
CREATE INDEX IF NOT EXISTS "deals_channel_created_at_idx" ON "deals"("channel", "created_at");
CREATE INDEX IF NOT EXISTS "deals_qualified_at_idx" ON "deals"("qualified_at");
CREATE INDEX IF NOT EXISTS "deals_proposal_sent_at_idx" ON "deals"("proposal_sent_at");

CREATE INDEX IF NOT EXISTS "pipeline_stage_history_deal_id_idx" ON "pipeline_stage_history"("deal_id");
CREATE INDEX IF NOT EXISTS "pipeline_stage_history_stage_entered_at_idx" ON "pipeline_stage_history"("stage", "entered_at");
CREATE INDEX IF NOT EXISTS "pipeline_stage_history_exited_at_idx" ON "pipeline_stage_history"("exited_at");

CREATE UNIQUE INDEX IF NOT EXISTS "monthly_goals_org_year_month_key" ON "monthly_goals"("organization_id", "year", "month");
CREATE INDEX IF NOT EXISTS "monthly_goals_org_idx" ON "monthly_goals"("organization_id");
CREATE INDEX IF NOT EXISTS "monthly_goals_month_idx" ON "monthly_goals"("month");
CREATE INDEX IF NOT EXISTS "monthly_goals_year_idx" ON "monthly_goals"("year");

CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_metric_cache_org_type_period_key" ON "dashboard_metric_cache"("organization_id", "metric_type", "period");
CREATE INDEX IF NOT EXISTS "dashboard_metric_cache_expires_at_idx" ON "dashboard_metric_cache"("expires_at");
CREATE INDEX IF NOT EXISTS "dashboard_metric_cache_org_type_idx" ON "dashboard_metric_cache"("organization_id", "metric_type");

SELECT 'Migração concluída com sucesso!' AS resultado;
