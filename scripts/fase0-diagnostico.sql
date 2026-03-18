-- ============================================================
-- FASE 0: Diagnóstico e Reconciliação da Migração
-- Synkra CRM SaaS - Script de Auditoria
-- ============================================================

-- 0.1 Listar todas as tabelas no schema public
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 0.2 Verificar coluna users.organization_id (conforme problema documentado)
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'organization_id';

-- 0.3 Auditar usuários sem OrganizationMember (usuários órfãos)
SELECT 
    u.id as user_id, 
    u.email, 
    u.organization_id as legacy_org_id,
    u.name,
    u.created_at
FROM users u
LEFT JOIN organization_members om ON om.user_id = u.id
WHERE om.id IS NULL;

-- 0.4 Verificar RLS (Row Level Security) em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.schemaname = pg_tables.schemaname AND p.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 0.5 Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 0.6 Verificar constraints de unique que podem afetar soft-delete
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 0.7 Contar registros por tabela (para estimar volume)
SELECT 
    'contacts' as table_name, COUNT(*) as count FROM contacts
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL SELECT 'organization_members', COUNT(*) FROM organization_members
UNION ALL SELECT 'deals', COUNT(*) FROM deals
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'whatsapp_cloud_instances', COUNT(*) FROM whatsapp_cloud_instances
ORDER BY table_name;

-- 0.8 Verificar users com organization_id legado mas sem membership
SELECT 
    COUNT(*) as total_users,
    COUNT(u.organization_id) as users_with_legacy_org,
    COUNT(om.id) as users_with_membership,
    COUNT(u.organization_id) - COUNT(om.id) as orphaned_users
FROM users u
LEFT JOIN organization_members om ON om.user_id = u.id;

-- 0.9 Verificar organizações sem owner válido
SELECT 
    o.id as org_id,
    o.name as org_name,
    o.owner_id,
    u.id as user_exists,
    om.user_id as has_membership
FROM organizations o
LEFT JOIN users u ON u.id = o.owner_id
LEFT JOIN organization_members om ON om.organization_id = o.id AND om.user_id = o.owner_id
WHERE u.id IS NULL OR om.id IS NULL;
