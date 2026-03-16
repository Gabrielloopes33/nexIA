-- Verificar quais tabelas têm organization_id
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'organization_id'
AND table_schema = 'public'
ORDER BY table_name;
