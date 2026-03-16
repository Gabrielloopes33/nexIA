-- Atualizar schema do banco para corresponder ao código

-- Adicionar colunas faltantes na tabela deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'WHATSAPP_OFFICIAL';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS estimated_value FLOAT DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS negotiation_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);

-- Criar tabela monthly_goals se não existir
CREATE TABLE IF NOT EXISTS monthly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    month TIMESTAMP NOT NULL,
    target_revenue FLOAT DEFAULT 0,
    target_deals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_goals_org_month ON monthly_goals(organization_id, month);

-- Criar tabela pipeline_stage_history se não existir
CREATE TABLE IF NOT EXISTS pipeline_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL,
    stage VARCHAR(255) NOT NULL,
    entered_at TIMESTAMP DEFAULT NOW(),
    exited_at TIMESTAMP,
    duration INT
);

-- Criar tabela deal_activities se não existir
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSONB,
    score_impact INT DEFAULT 0,
    performed_by UUID,
    automation_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela dashboard_metric_cache se não existir
CREATE TABLE IF NOT EXISTS dashboard_metric_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    period VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Transferir ownership para supabase_admin
REASSIGN OWNED BY postgres TO supabase_admin;

-- Mensagem de sucesso
SELECT 'Schema atualizado com sucesso!' AS status;
