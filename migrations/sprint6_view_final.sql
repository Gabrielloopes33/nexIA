-- View completa do dashboard com dados reais
-- Baseado nas tabelas existentes no banco

DROP VIEW IF EXISTS v_dashboard_summary;

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- Contatos (verificar nome correto da tabela)
    COALESCE((
        SELECT COUNT(*) FROM contacts c 
        WHERE c.organization_id = o.id 
    ), 0) as total_contacts,
    
    -- Contatos novos este mês
    COALESCE((
        SELECT COUNT(*) FROM contacts c 
        WHERE c.organization_id = o.id 
        AND c.created_at >= DATE_TRUNC('month', NOW())
    ), 0) as new_contacts_this_month,
    
    -- Conversas (usando chat_sessions ou chats)
    COALESCE((
        SELECT COUNT(*) FROM chat_sessions cs 
        WHERE cs.organization_id = o.id
    ), COALESCE((
        SELECT COUNT(*) FROM chats c 
        WHERE c.organization_id = o.id
    ), 0)) as total_conversations,
    
    -- Conversas ativas
    COALESCE((
        SELECT COUNT(*) FROM chat_sessions cs 
        WHERE cs.organization_id = o.id AND cs.status = 'active'
    ), COALESCE((
        SELECT COUNT(*) FROM chats c 
        WHERE c.organization_id = o.id AND c.status = 'active'
    ), 0)) as active_conversations,
    
    -- Conversas pendentes
    COALESCE((
        SELECT COUNT(*) FROM chat_sessions cs 
        WHERE cs.organization_id = o.id AND cs.status = 'pending'
    ), COALESCE((
        SELECT COUNT(*) FROM chats c 
        WHERE c.organization_id = o.id AND c.status = 'pending'
    ), 0)) as pending_conversations,
    
    -- Total de deals
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        WHERE d.organization_id = o.id
    ), 0) as total_deals,
    
    -- Deals ganhos
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        JOIN pipeline_stages ps ON d.stage_id = ps.id
        WHERE d.organization_id = o.id 
        AND (ps.name ILIKE '%won%' OR ps.name ILIKE '%ganho%' OR ps.name ILIKE '%fechado%' OR ps.name ILIKE '%win%')
    ), 0) as won_deals,
    
    -- Deals perdidos
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        JOIN pipeline_stages ps ON d.stage_id = ps.id
        WHERE d.organization_id = o.id 
        AND (ps.name ILIKE '%lost%' OR ps.name ILIKE '%perdido%' OR ps.name ILIKE '%lose%')
    ), 0) as lost_deals,
    
    -- Valor do pipeline
    COALESCE((
        SELECT SUM(d.value) FROM deals d 
        JOIN pipeline_stages ps ON d.stage_id = ps.id
        WHERE d.organization_id = o.id 
        AND ps.name NOT ILIKE '%lost%' 
        AND ps.name NOT ILIKE '%perdido%'
    ), 0) as pipeline_value,
    
    -- Receita mensal
    COALESCE((
        SELECT SUM(c.amount_cents) / 100.0 
        FROM charges c 
        WHERE c.organization_id = o.id 
        AND c.status = 'paid'
        AND c.paid_at >= DATE_TRUNC('month', NOW())
    ), 0) as monthly_revenue,
    
    -- Assinaturas ativas
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'active'
    ), 0) as active_subscriptions,
    
    -- Assinaturas em trial
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'trialing'
    ), 0) as trial_subscriptions,
    
    NOW() as calculated_at
FROM organizations o;

-- Verificar resultado
SELECT * FROM v_dashboard_summary ORDER BY organization_name;
