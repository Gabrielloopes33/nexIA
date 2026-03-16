-- Sprint 6: Dashboard e Métricas (CORRIGIDO)
-- Data: 2026-03-13

-- ============================================
-- FUNÇÃO: update_updated_at_column (garantir que existe)
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

-- Drop a tabela se existir (para garantir schema correto)
DROP TABLE IF EXISTS dashboard_metrics CASCADE;

-- Criar tabela do zero
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
    
    -- Constraint única para evitar duplicatas
    CONSTRAINT unique_organization_metric_period UNIQUE (organization_id, metric_key, metric_period, reference_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_dashboard_metrics_organization_id 
    ON dashboard_metrics(organization_id);

CREATE INDEX idx_dashboard_metrics_metric_key 
    ON dashboard_metrics(metric_key);

CREATE INDEX idx_dashboard_metrics_reference_date 
    ON dashboard_metrics(reference_date);

CREATE INDEX idx_dashboard_metrics_org_key_date 
    ON dashboard_metrics(organization_id, metric_key, reference_date DESC);

CREATE INDEX idx_dashboard_metrics_period 
    ON dashboard_metrics(metric_period);

CREATE INDEX idx_dashboard_metrics_metadata 
    ON dashboard_metrics USING GIN(metadata);

-- ============================================
-- TRIGGER: updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_dashboard_metrics_updated_at ON dashboard_metrics;

CREATE TRIGGER update_dashboard_metrics_updated_at
    BEFORE UPDATE ON dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEW: v_dashboard_summary
-- ============================================

DROP VIEW IF EXISTS v_dashboard_summary;

CREATE OR REPLACE VIEW v_dashboard_summary AS
WITH contact_stats AS (
    SELECT 
        organization_id,
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_contacts,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND deleted_at IS NULL) as new_contacts_this_month
    FROM contacts
    GROUP BY organization_id
),
conversation_stats AS (
    SELECT 
        organization_id,
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE status = 'active') as active_conversations,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_conversations
    FROM conversations
    GROUP BY organization_id
),
deal_stats AS (
    SELECT 
        d.organization_id,
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE ps.name ILIKE '%won%' OR ps.name ILIKE '%ganho%') as won_deals,
        COUNT(*) FILTER (WHERE ps.name ILIKE '%lost%' OR ps.name ILIKE '%perdido%') as lost_deals,
        SUM(d.value) FILTER (WHERE ps.name NOT ILIKE '%lost%' AND ps.name NOT ILIKE '%perdido%') as pipeline_value
    FROM deals d
    LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
    GROUP BY d.organization_id
),
monthly_revenue AS (
    SELECT 
        organization_id,
        COALESCE(SUM(amount), 0) as monthly_revenue
    FROM charges
    WHERE status = 'paid'
        AND paid_at >= DATE_TRUNC('month', NOW())
    GROUP BY organization_id
),
subscription_stats AS (
    SELECT 
        organization_id,
        COUNT(*) as active_subscriptions,
        COUNT(*) FILTER (WHERE status = 'trial') as trial_subscriptions
    FROM subscriptions
    WHERE status IN ('active', 'trial')
    GROUP BY organization_id
)
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COALESCE(cs.total_contacts, 0) as total_contacts,
    COALESCE(cs.new_contacts_this_month, 0) as new_contacts_this_month,
    COALESCE(conv.total_conversations, 0) as total_conversations,
    COALESCE(conv.active_conversations, 0) as active_conversations,
    COALESCE(conv.pending_conversations, 0) as pending_conversations,
    COALESCE(ds.total_deals, 0) as total_deals,
    COALESCE(ds.won_deals, 0) as won_deals,
    COALESCE(ds.lost_deals, 0) as lost_deals,
    COALESCE(ds.pipeline_value, 0) as pipeline_value,
    COALESCE(mr.monthly_revenue, 0) as monthly_revenue,
    COALESCE(ss.active_subscriptions, 0) as active_subscriptions,
    COALESCE(ss.trial_subscriptions, 0) as trial_subscriptions,
    NOW() as calculated_at
FROM organizations o
LEFT JOIN contact_stats cs ON o.id = cs.organization_id
LEFT JOIN conversation_stats conv ON o.id = conv.organization_id
LEFT JOIN deal_stats ds ON o.id = ds.organization_id
LEFT JOIN monthly_revenue mr ON o.id = mr.organization_id
LEFT JOIN subscription_stats ss ON o.id = ss.organization_id;

-- ============================================
-- SEED DATA: Métricas iniciais
-- ============================================

INSERT INTO dashboard_metrics (organization_id, metric_key, metric_value, metric_period, reference_date, metadata, calculated_at)
SELECT 
    o.id as organization_id,
    'total_contacts' as metric_key,
    COALESCE((SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id AND c.deleted_at IS NULL), 0) as metric_value,
    'all_time' as metric_period,
    CURRENT_DATE as reference_date,
    jsonb_build_object('source', 'initial_seed', 'calculated_from', 'contacts_table') as metadata,
    NOW() as calculated_at
FROM organizations o
ON CONFLICT (organization_id, metric_key, metric_period, reference_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = NOW();

INSERT INTO dashboard_metrics (organization_id, metric_key, metric_value, metric_period, reference_date, metadata, calculated_at)
SELECT 
    o.id as organization_id,
    'total_conversations' as metric_key,
    COALESCE((SELECT COUNT(*) FROM conversations c WHERE c.organization_id = o.id), 0) as metric_value,
    'all_time' as metric_period,
    CURRENT_DATE as reference_date,
    jsonb_build_object('source', 'initial_seed', 'calculated_from', 'conversations_table') as metadata,
    NOW() as calculated_at
FROM organizations o
ON CONFLICT (organization_id, metric_key, metric_period, reference_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = NOW();

INSERT INTO dashboard_metrics (organization_id, metric_key, metric_value, metric_period, reference_date, metadata, calculated_at)
SELECT 
    o.id as organization_id,
    'active_deals' as metric_key,
    COALESCE((SELECT COUNT(*) FROM deals d WHERE d.organization_id = o.id AND d.status = 'active'), 0) as metric_value,
    'all_time' as metric_period,
    CURRENT_DATE as reference_date,
    jsonb_build_object('source', 'initial_seed', 'calculated_from', 'deals_table') as metadata,
    NOW() as calculated_at
FROM organizations o
ON CONFLICT (organization_id, metric_key, metric_period, reference_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = NOW();

INSERT INTO dashboard_metrics (organization_id, metric_key, metric_value, metric_period, reference_date, metadata, calculated_at)
SELECT 
    o.id as organization_id,
    'pipeline_value' as metric_key,
    COALESCE((SELECT SUM(d.value) FROM deals d JOIN pipeline_stages ps ON d.stage_id = ps.id WHERE d.organization_id = o.id AND ps.name NOT ILIKE '%lost%'), 0) as metric_value,
    'all_time' as metric_period,
    CURRENT_DATE as reference_date,
    jsonb_build_object('source', 'initial_seed', 'calculated_from', 'deals_table') as metadata,
    NOW() as calculated_at
FROM organizations o
ON CONFLICT (organization_id, metric_key, metric_period, reference_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'Tabela dashboard_metrics criada com sucesso' as status;
SELECT 'View v_dashboard_summary criada com sucesso' as status;
SELECT COUNT(*) as total_metrics FROM dashboard_metrics;
