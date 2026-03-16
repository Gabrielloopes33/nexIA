-- ============================================
-- MIGRATION: Dashboard Metrics Schema Extensions
-- Data: 2025-03-13
-- ============================================

-- ============================================
-- 1. CRIAR ENUMS
-- ============================================

-- Verificar se enums já existem antes de criar
DO $$
BEGIN
    -- LostReason enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lostreason') THEN
        CREATE TYPE "LostReason" AS ENUM (
            'PRICE',
            'COMPETITOR',
            'TIMING',
            'NO_BUDGET',
            'NO_INTEREST',
            'UNREACHABLE',
            'OTHER'
        );
    END IF;

    -- ChannelType enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channeltype') THEN
        CREATE TYPE "ChannelType" AS ENUM (
            'WHATSAPP_OFFICIAL',
            'WHATSAPP_UNOFFICIAL',
            'INSTAGRAM',
            'MANUAL',
            'API'
        );
    END IF;

    -- RecoveryPotential enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recoverypotential') THEN
        CREATE TYPE "RecoveryPotential" AS ENUM (
            'HIGH',
            'MEDIUM',
            'LOW',
            'NONE'
        );
    END IF;
END
$$;

-- ============================================
-- 2. ADICIONAR COLUNAS À TABELA DEALS
-- ============================================

-- Campos para métricas de perda e recuperação
ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS lost_reason "LostReason",
    ADD COLUMN IF NOT EXISTS lost_reason_detail TEXT,
    ADD COLUMN IF NOT EXISTS lost_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS recovery_potential "RecoveryPotential",
    ADD COLUMN IF NOT EXISTS recovery_score DOUBLE PRECISION;

-- Campos para tracking de origem e canal
ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS channel "ChannelType",
    ADD COLUMN IF NOT EXISTS channel_instance_id TEXT;

-- Campos para velocidade do funil
ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS entered_stage_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS proposal_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS negotiation_at TIMESTAMP(3);

-- Campos para follow-up tracking
ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- Campos para metas e forecast
ALTER TABLE deals 
    ADD COLUMN IF NOT EXISTS monthly_goal_id TEXT,
    ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(15, 2);

-- ============================================
-- 3. CRIAR ÍNDICES NA TABELA DEALS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deals_org_lost_at 
    ON deals(organization_id, lost_at);

CREATE INDEX IF NOT EXISTS idx_deals_org_status_lost_reason 
    ON deals(organization_id, status, lost_reason);

CREATE INDEX IF NOT EXISTS idx_deals_org_channel 
    ON deals(organization_id, channel);

CREATE INDEX IF NOT EXISTS idx_deals_org_recovery_potential 
    ON deals(organization_id, recovery_potential);

CREATE INDEX IF NOT EXISTS idx_deals_org_next_follow_up 
    ON deals(organization_id, next_follow_up_at);

CREATE INDEX IF NOT EXISTS idx_deals_org_entered_stage 
    ON deals(organization_id, entered_stage_at);

-- ============================================
-- 4. CRIAR TABELA: PIPELINE_STAGE_HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS pipeline_stage_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entered_at TIMESTAMP(3) NOT NULL,
    exited_at TIMESTAMP(3),
    duration_hours INTEGER,
    amount DECIMAL(15, 2),
    lead_score INTEGER,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para pipeline_stage_history
CREATE INDEX IF NOT EXISTS idx_psh_deal_id ON pipeline_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_psh_stage_id ON pipeline_stage_history(stage_id);
CREATE INDEX IF NOT EXISTS idx_psh_org_id ON pipeline_stage_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_psh_entered_at ON pipeline_stage_history(entered_at);
CREATE INDEX IF NOT EXISTS idx_psh_org_entered ON pipeline_stage_history(organization_id, entered_at);

-- ============================================
-- 5. CRIAR TABELA: MONTHLY_GOALS
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_goals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_goal DECIMAL(15, 2) NOT NULL,
    deals_goal INTEGER NOT NULL,
    leads_goal INTEGER NOT NULL,
    conversion_goal DOUBLE PRECISION NOT NULL,
    revenue_achieved DECIMAL(15, 2),
    deals_achieved INTEGER DEFAULT 0,
    leads_achieved INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_org_year_month UNIQUE (organization_id, year, month)
);

-- Índices para monthly_goals
CREATE INDEX IF NOT EXISTS idx_mg_org_id ON monthly_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_mg_year_month ON monthly_goals(year, month);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_monthly_goals_updated_at ON monthly_goals;
CREATE TRIGGER update_monthly_goals_updated_at
    BEFORE UPDATE ON monthly_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CRIAR TABELA: DASHBOARD_METRIC_CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS dashboard_metric_cache (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    period TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_org_metric_period UNIQUE (organization_id, metric_type, period)
);

-- Índices para dashboard_metric_cache
CREATE INDEX IF NOT EXISTS idx_dmc_org_id ON dashboard_metric_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_dmc_metric_type ON dashboard_metric_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_dmc_expires_at ON dashboard_metric_cache(expires_at);

-- ============================================
-- 7. CRIAR TABELA: CHANNEL_METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS channel_metrics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    channel "ChannelType" NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    first_response_count INTEGER DEFAULT 0,
    avg_first_response_secs INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    deals_created INTEGER DEFAULT 0,
    deals_won INTEGER DEFAULT 0,
    revenue_won DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_org_date_channel UNIQUE (organization_id, date, channel)
);

-- Índices para channel_metrics
CREATE INDEX IF NOT EXISTS idx_cm_org_id ON channel_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_cm_date ON channel_metrics(date);
CREATE INDEX IF NOT EXISTS idx_cm_channel ON channel_metrics(channel);
CREATE INDEX IF NOT EXISTS idx_cm_org_date ON channel_metrics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_cm_org_channel ON channel_metrics(organization_id, channel);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_channel_metrics_updated_at ON channel_metrics;
CREATE TRIGGER update_channel_metrics_updated_at
    BEFORE UPDATE ON channel_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VIEW MATERIALIZADA: MV_FUNNEL_BY_STAGE
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_funnel_by_stage AS
SELECT 
    organization_id,
    stage_id,
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as deal_count,
    COALESCE(SUM(amount), 0) as total_value,
    AVG(lead_score) as avg_lead_score
FROM deals
WHERE status = 'OPEN'
GROUP BY organization_id, stage_id, DATE_TRUNC('week', created_at);

-- Índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_funnel_unique 
    ON mv_funnel_by_stage(organization_id, stage_id, week);

CREATE INDEX IF NOT EXISTS idx_mv_funnel_org 
    ON mv_funnel_by_stage(organization_id);

-- Função para refresh da view
CREATE OR REPLACE FUNCTION refresh_funnel_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_funnel_by_stage;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNÇÕES AUXILIARES
-- ============================================

-- Função para calcular health score
CREATE OR REPLACE FUNCTION calculate_health_score(p_org_id TEXT)
RETURNS TABLE (
    total_score DOUBLE PRECISION,
    conversion_score DOUBLE PRECISION,
    velocity_score DOUBLE PRECISION,
    stagnation_score DOUBLE PRECISION,
    followup_score DOUBLE PRECISION
) AS $$
DECLARE
    v_conversion_rate DOUBLE PRECISION;
    v_goal_rate DOUBLE PRECISION;
    v_avg_days DOUBLE PRECISION;
    v_stagnant_count INTEGER;
    v_total_open INTEGER;
    v_overdue_count INTEGER;
BEGIN
    -- 1. Conversão vs Meta (30%)
    SELECT 
        CASE WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE status = 'WON')::DOUBLE PRECISION / COUNT(*)) * 100 
            ELSE 0 
        END,
        COALESCE((SELECT conversion_goal FROM monthly_goals 
                  WHERE organization_id = p_org_id 
                  AND year = EXTRACT(YEAR FROM CURRENT_DATE)
                  AND month = EXTRACT(MONTH FROM CURRENT_DATE)), 20)
    INTO v_conversion_rate, v_goal_rate
    FROM deals
    WHERE organization_id = p_org_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- 2. Velocidade do Funil (25%)
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (actual_close_date - created_at)) / 86400), 30)
    INTO v_avg_days
    FROM deals
    WHERE organization_id = p_org_id
    AND status = 'WON'
    AND actual_close_date >= CURRENT_DATE - INTERVAL '90 days';
    
    -- 3. Leads Estagnados (25%)
    SELECT 
        COUNT(*) FILTER (WHERE last_follow_up_at < CURRENT_DATE - INTERVAL '7 days' OR last_follow_up_at IS NULL),
        COUNT(*)
    INTO v_stagnant_count, v_total_open
    FROM deals
    WHERE organization_id = p_org_id
    AND status = 'OPEN';
    
    -- 4. Follow-up em dia (20%)
    SELECT COUNT(*)
    INTO v_overdue_count
    FROM deals
    WHERE organization_id = p_org_id
    AND status = 'OPEN'
    AND next_follow_up_at < CURRENT_DATE;
    
    -- Calcular scores
    RETURN QUERY
    SELECT 
        LEAST(100, (v_conversion_rate / v_goal_rate) * 100) * 0.30 +
        GREATEST(0, 100 - ((v_avg_days - 7) / 53) * 100) * 0.25 +
        GREATEST(0, 100 - (v_stagnant_count::DOUBLE PRECISION / NULLIF(v_total_open, 0)) * 200) * 0.25 +
        GREATEST(0, 100 - (v_overdue_count::DOUBLE PRECISION / NULLIF(v_total_open, 0)) * 100) * 0.20,
        LEAST(100, (v_conversion_rate / v_goal_rate) * 100),
        GREATEST(0, 100 - ((v_avg_days - 7) / 53) * 100),
        GREATEST(0, 100 - (v_stagnant_count::DOUBLE PRECISION / NULLIF(v_total_open, 0)) * 200),
        GREATEST(0, 100 - (v_overdue_count::DOUBLE PRECISION / NULLIF(v_total_open, 0)) * 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE pipeline_stage_history IS 'Histórico de movimentação de deals entre etapas do funil';
COMMENT ON TABLE monthly_goals IS 'Metas mensais de receita, deals e leads por organização';
COMMENT ON TABLE dashboard_metric_cache IS 'Cache de métricas calculadas do dashboard';
COMMENT ON TABLE channel_metrics IS 'Métricas diárias agregadas por canal de comunicação';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
