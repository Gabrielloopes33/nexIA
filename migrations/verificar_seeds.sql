-- Verificar todos os seeds criados

-- Planos
SELECT 'PLANOS' as tipo, id, name, price_cents/100.0::text as preco, status 
FROM plans 
ORDER BY sort_order;

-- Cupons
SELECT 'CUPONS' as tipo, id, code, 
  COALESCE(discount_percent || '%', 'R$ ' || discount_cents/100.0::text) as desconto,
  status
FROM coupons;

-- Templates
SELECT 'TEMPLATES' as tipo, id, name, category, is_default::text
FROM pipeline_templates;

-- Integrações
SELECT 'INTEGRAÇÕES' as tipo, id, type, name, category
FROM integration_types
ORDER BY name;

-- Resumo
SELECT 'RESUMO' as tipo, 
  (SELECT COUNT(*) FROM plans) || ' planos' as item, '' as extra
UNION ALL
SELECT 'RESUMO', (SELECT COUNT(*) FROM coupons) || ' cupons', ''
UNION ALL
SELECT 'RESUMO', (SELECT COUNT(*) FROM pipeline_templates) || ' templates', ''
UNION ALL
SELECT 'RESUMO', (SELECT COUNT(*) FROM integration_types) || ' integrações', '';
