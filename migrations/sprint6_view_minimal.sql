-- View MINIMAL usando apenas tabelas confirmadas
-- Versão segura que funciona com certeza

DROP VIEW IF EXISTS v_dashboard_summary;

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- CHARGES (receita)
    COALESCE((
        SELECT SUM(c.amount_cents) / 100.0 
        FROM charges c 
        WHERE c.organization_id = o.id 
        AND c.status = 'paid'
        AND c.paid_at >= DATE_TRUNC('month', NOW())
    ), 0) as monthly_revenue,
    
    -- SUBSCRIPTIONS (assinaturas)
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
    
    -- Placeholders para dados que precisamos investigar
    0::bigint as total_contacts,
    0::bigint as total_deals,
    0::numeric as pipeline_value,
    0::bigint as total_conversations,
    
    NOW() as calculated_at
FROM organizations o;

-- Verificar resultado
SELECT 'View criada com sucesso!' as status;
SELECT * FROM v_dashboard_summary ORDER BY monthly_revenue DESC;
