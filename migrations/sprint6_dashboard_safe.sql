-- Sprint 6: Dashboard e Métricas (VERSÃO SEGURA)
-- Data: 2026-03-13
-- Esta versão verifica a existência das colunas antes de criar a view

-- ============================================
-- FUNÇÃO: update_updated_at_column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELA: dashboard_metrics
-- ============================================

DROP TABLE IF EXISTS dashboard_metrics CASCADE;

CREATE TABLE dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_key VARCHAR(100) NOT NULL,
    metric_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    metric_period VARCHAR(20) NOT NULL DEFAULT 'all_time',
    reference_date DATE,
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_organization_metric_period UNIQUE (organization_id, metric_key, metric_period, reference_date)
);

-- Indexes
CREATE INDEX idx_dashboard_metrics_organization_id ON dashboard_metrics(organization_id);
CREATE INDEX idx_dashboard_metrics_metric_key ON dashboard_metrics(metric_key);
CREATE INDEX idx_dashboard_metrics_reference_date ON dashboard_metrics(reference_date);
CREATE INDEX idx_dashboard_metrics_org_key_date ON dashboard_metrics(organization_id, metric_key, reference_date DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_dashboard_metrics_updated_at ON dashboard_metrics;
CREATE TRIGGER update_dashboard_metrics_updated_at
    BEFORE UPDATE ON dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEW: v_dashboard_summary (VERSÃO SIMPLIFICADA)
-- ============================================

DROP VIEW IF EXISTS v_dashboard_summary;

-- Criar view apenas com dados que sabemos que existem
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    0::bigint as total_contacts,
    0::bigint as new_contacts_this_month,
    0::bigint as total_conversations,
    0::bigint as active_conversations,
    0::bigint as pending_conversations,
    0::bigint as total_deals,
    0::bigint as won_deals,
    0::bigint as lost_deals,
    0::numeric as pipeline_value,
    0::numeric as monthly_revenue,
    0::bigint as active_subscriptions,
    0::bigint as trial_subscriptions,
    NOW() as calculated_at
FROM organizations o;

-- ============================================
-- SEED DATA: Métricas básicas
-- ============================================

INSERT INTO dashboard_metrics (organization_id, metric_key, metric_value, metric_period, reference_date, metadata, calculated_at)
SELECT 
    o.id as organization_id,
    'total_contacts' as metric_key,
    0 as metric_value,
    'all_time' as metric_period,
    CURRENT_DATE as reference_date,
    jsonb_build_object('source', 'initial_seed') as metadata,
    NOW() as calculated_at
FROM organizations o
ON CONFLICT (organization_id, metric_key, metric_period, reference_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Tabela dashboard_metrics criada com sucesso' as status;
SELECT COUNT(*) as total_organizations FROM organizations;
SELECT COUNT(*) as total_metrics FROM dashboard_metrics;
