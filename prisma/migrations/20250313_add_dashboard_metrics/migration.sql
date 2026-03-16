-- Adicionar enums
CREATE TYPE "LostReason" AS ENUM ('NO_BUDGET', 'NO_INTEREST', 'COMPETITOR', 'NO_RESPONSE', 'TIMING', 'OTHER');
CREATE TYPE "ChannelType" AS ENUM ('WHATSAPP_OFFICIAL', 'WHATSAPP_UNOFFICIAL', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'PHONE', 'FORM');

-- Adicionar colunas na tabela Deal
ALTER TABLE "deals" ADD COLUMN "lostReason" "LostReason";
ALTER TABLE "deals" ADD COLUMN "closed_lost_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "closed_won_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "channel" "ChannelType" NOT NULL DEFAULT 'WHATSAPP_OFFICIAL';
ALTER TABLE "deals" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "deals" ADD COLUMN "estimated_value" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "deals" ADD COLUMN "qualified_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "proposal_sent_at" TIMESTAMP(3);
ALTER TABLE "deals" ADD COLUMN "negotiation_at" TIMESTAMP(3);

-- Criar tabela PipelineStageHistory
CREATE TABLE "pipeline_stage_history" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exited_at" TIMESTAMP(3),
    "duration" INTEGER,
    CONSTRAINT "pipeline_stage_history_pkey" PRIMARY KEY ("id")
);

-- Criar tabela MonthlyGoal
CREATE TABLE "monthly_goals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "target_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_deals" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "monthly_goals_pkey" PRIMARY KEY ("id")
);

-- Criar tabela DashboardMetricCache
CREATE TABLE "dashboard_metric_cache" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dashboard_metric_cache_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX "deals_status_createdAt_idx" ON "deals"("status", "created_at");
CREATE INDEX "deals_lostReason_closedLostAt_idx" ON "deals"("lostReason", "closed_lost_at");
CREATE INDEX "deals_channel_createdAt_idx" ON "deals"("channel", "created_at");
CREATE INDEX "deals_qualifiedAt_idx" ON "deals"("qualified_at");
CREATE INDEX "deals_proposalSentAt_idx" ON "deals"("proposal_sent_at");

CREATE INDEX "pipeline_stage_history_dealId_idx" ON "pipeline_stage_history"("deal_id");
CREATE INDEX "pipeline_stage_history_stage_enteredAt_idx" ON "pipeline_stage_history"("stage", "entered_at");
CREATE INDEX "pipeline_stage_history_exitedAt_idx" ON "pipeline_stage_history"("exited_at");

CREATE UNIQUE INDEX "monthly_goals_organizationId_month_key" ON "monthly_goals"("organization_id", "month");
CREATE INDEX "monthly_goals_organizationId_idx" ON "monthly_goals"("organization_id");
CREATE INDEX "monthly_goals_month_idx" ON "monthly_goals"("month");

CREATE UNIQUE INDEX "dashboard_metric_cache_organizationId_metricType_period_key" ON "dashboard_metric_cache"("organization_id", "metric_type", "period");
CREATE INDEX "dashboard_metric_cache_expiresAt_idx" ON "dashboard_metric_cache"("expires_at");
CREATE INDEX "dashboard_metric_cache_organizationId_metricType_idx" ON "dashboard_metric_cache"("organization_id", "metric_type");

-- Foreign Keys
ALTER TABLE "pipeline_stage_history" ADD CONSTRAINT "pipeline_stage_history_dealId_fkey" 
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
