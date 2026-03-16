-- View do dashboard usando APENAS tabelas confirmadas
-- deals, charges, subscriptions (essas tem organization_id)

DROP VIEW IF EXISTS v_dashboard_summary;

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- DEALS (funciona - tem organization_id)
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
    
    -- CHARGES (funciona - tem organization_id)
    COALESCE((
        SELECT SUM(c.amount_cents) / 100.0 
        FROM charges c 
        WHERE c.organization_id = o.id 
        AND c.status = 'paid'
        AND c.paid_at >= DATE_TRUNC('month', NOW())
    ), 0) as monthly_revenue,
    
    -- SUBSCRIPTIONS (funciona - tem organization_id)
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'active'
    ), 0) as active_subscriptions,
    
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'trialing'
    ), 0) as trial_subscriptions,
    
    -- PLACEHOLDERS (tabelas sem organization_id)
    0::bigint as total_contacts,
    0::bigint as new_contacts_this_month,
    0::bigint as total_conversations,
    0::bigint as active_conversations,
    0::bigint as pending_conversations,
    
    NOW() as calculated_at
FROM organizations o;

-- Verificar
SELECT 'View criada com sucesso!' as status;
SELECT * FROM v_dashboard_summary ORDER BY monthly_revenue DESC;
