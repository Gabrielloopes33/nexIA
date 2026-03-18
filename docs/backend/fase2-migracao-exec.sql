-- ============================================================================
-- FASE 2 - Row Level Security (RLS) Migration - VERSÃO EXECUTÁVEL
-- ============================================================================
-- Descrição: Apenas tabelas que existem no banco de dados
-- Data: 2026-03-18
-- Tabelas removidas: transcriptions, ai_insights, instagram_instances, 
--                    integrations, integration_activity_logs, meta_webhook_logs,
--                    whatsapp_cloud_templates, whatsapp_cloud_logs, 
--                    pending_form_deliveries, custom_field_definitions,
--                    contact_custom_field_values, organization_units, coupons
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- Função para verificar se o usuário atual pode acessar uma organização
-- Aceita TEXT pois organization_id é String no Prisma (não UUID)
CREATE OR REPLACE FUNCTION public.check_org_access(org_id text)
RETURNS BOOLEAN AS $$
BEGIN
    -- Se não há org_id setado na sessão, nega acesso
    IF current_setting('app.current_org_id', true) IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Compara o org_id do registro com o da sessão (ambos como text)
    RETURN org_id = current_setting('app.current_org_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 2: TABELAS CRÍTICAS (contacts, deals, conversations, messages)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- contacts
-- ----------------------------------------------------------------------------
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_own_org" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_own_org" ON contacts;
DROP POLICY IF EXISTS "contacts_update_own_org" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_own_org" ON contacts;

CREATE POLICY "contacts_select_own_org" ON contacts
    FOR SELECT
    USING (check_org_access(organization_id));

CREATE POLICY "contacts_insert_own_org" ON contacts
    FOR INSERT
    WITH CHECK (check_org_access(organization_id));

CREATE POLICY "contacts_update_own_org" ON contacts
    FOR UPDATE
    USING (check_org_access(organization_id));

CREATE POLICY "contacts_delete_own_org" ON contacts
    FOR DELETE
    USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- deals
-- ----------------------------------------------------------------------------
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals_select_own_org" ON deals;
DROP POLICY IF EXISTS "deals_insert_own_org" ON deals;
DROP POLICY IF EXISTS "deals_update_own_org" ON deals;
DROP POLICY IF EXISTS "deals_delete_own_org" ON deals;

CREATE POLICY "deals_select_own_org" ON deals
    FOR SELECT
    USING (check_org_access(organization_id));

CREATE POLICY "deals_insert_own_org" ON deals
    FOR INSERT
    WITH CHECK (check_org_access(organization_id));

CREATE POLICY "deals_update_own_org" ON deals
    FOR UPDATE
    USING (check_org_access(organization_id));

CREATE POLICY "deals_delete_own_org" ON deals
    FOR DELETE
    USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- conversations
-- ----------------------------------------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_own_org" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_own_org" ON conversations;
DROP POLICY IF EXISTS "conversations_update_own_org" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_own_org" ON conversations;

CREATE POLICY "conversations_select_own_org" ON conversations
    FOR SELECT
    USING (check_org_access(organization_id));

CREATE POLICY "conversations_insert_own_org" ON conversations
    FOR INSERT
    WITH CHECK (check_org_access(organization_id));

CREATE POLICY "conversations_update_own_org" ON conversations
    FOR UPDATE
    USING (check_org_access(organization_id));

CREATE POLICY "conversations_delete_own_org" ON conversations
    FOR DELETE
    USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- messages (via conversation)
-- ----------------------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_via_conversation" ON messages;
DROP POLICY IF EXISTS "messages_insert_via_conversation" ON messages;
DROP POLICY IF EXISTS "messages_update_via_conversation" ON messages;
DROP POLICY IF EXISTS "messages_delete_via_conversation" ON messages;

CREATE POLICY "messages_select_via_conversation" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND check_org_access(conversations.organization_id)
        )
    );

CREATE POLICY "messages_insert_via_conversation" ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND check_org_access(conversations.organization_id)
        )
    );

CREATE POLICY "messages_update_via_conversation" ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND check_org_access(conversations.organization_id)
        )
    );

CREATE POLICY "messages_delete_via_conversation" ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND check_org_access(conversations.organization_id)
        )
    );

-- ============================================================================
-- PARTE 3: TABELAS IMPORTANTES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- schedules
-- ----------------------------------------------------------------------------
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select_own_org" ON schedules;
DROP POLICY IF EXISTS "schedules_insert_own_org" ON schedules;
DROP POLICY IF EXISTS "schedules_update_own_org" ON schedules;
DROP POLICY IF EXISTS "schedules_delete_own_org" ON schedules;

CREATE POLICY "schedules_select_own_org" ON schedules FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "schedules_insert_own_org" ON schedules FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "schedules_update_own_org" ON schedules FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "schedules_delete_own_org" ON schedules FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- tags
-- ----------------------------------------------------------------------------
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_select_own_org" ON tags;
DROP POLICY IF EXISTS "tags_insert_own_org" ON tags;
DROP POLICY IF EXISTS "tags_update_own_org" ON tags;
DROP POLICY IF EXISTS "tags_delete_own_org" ON tags;

CREATE POLICY "tags_select_own_org" ON tags FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "tags_insert_own_org" ON tags FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "tags_update_own_org" ON tags FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "tags_delete_own_org" ON tags FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- lists
-- ----------------------------------------------------------------------------
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lists_select_own_org" ON lists;
DROP POLICY IF EXISTS "lists_insert_own_org" ON lists;
DROP POLICY IF EXISTS "lists_update_own_org" ON lists;
DROP POLICY IF EXISTS "lists_delete_own_org" ON lists;

CREATE POLICY "lists_select_own_org" ON lists FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "lists_insert_own_org" ON lists FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "lists_update_own_org" ON lists FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "lists_delete_own_org" ON lists FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- segments
-- ----------------------------------------------------------------------------
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "segments_select_own_org" ON segments;
DROP POLICY IF EXISTS "segments_insert_own_org" ON segments;
DROP POLICY IF EXISTS "segments_update_own_org" ON segments;
DROP POLICY IF EXISTS "segments_delete_own_org" ON segments;

CREATE POLICY "segments_select_own_org" ON segments FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "segments_insert_own_org" ON segments FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "segments_update_own_org" ON segments FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "segments_delete_own_org" ON segments FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- whatsapp_cloud_instances
-- ----------------------------------------------------------------------------
ALTER TABLE whatsapp_cloud_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_instances FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_instances_select_own_org" ON whatsapp_cloud_instances;
DROP POLICY IF EXISTS "whatsapp_instances_insert_own_org" ON whatsapp_cloud_instances;
DROP POLICY IF EXISTS "whatsapp_instances_update_own_org" ON whatsapp_cloud_instances;
DROP POLICY IF EXISTS "whatsapp_instances_delete_own_org" ON whatsapp_cloud_instances;

CREATE POLICY "whatsapp_instances_select_own_org" ON whatsapp_cloud_instances FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_insert_own_org" ON whatsapp_cloud_instances FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_update_own_org" ON whatsapp_cloud_instances FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_delete_own_org" ON whatsapp_cloud_instances FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own_org" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own_org" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own_org" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own_org" ON subscriptions;

CREATE POLICY "subscriptions_select_own_org" ON subscriptions FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "subscriptions_insert_own_org" ON subscriptions FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "subscriptions_update_own_org" ON subscriptions FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "subscriptions_delete_own_org" ON subscriptions FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- invoices
-- ----------------------------------------------------------------------------
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own_org" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_own_org" ON invoices;
DROP POLICY IF EXISTS "invoices_update_own_org" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_own_org" ON invoices;

CREATE POLICY "invoices_select_own_org" ON invoices FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "invoices_insert_own_org" ON invoices FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "invoices_update_own_org" ON invoices FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "invoices_delete_own_org" ON invoices FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- charges
-- ----------------------------------------------------------------------------
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charges_select_own_org" ON charges;
DROP POLICY IF EXISTS "charges_insert_own_org" ON charges;
DROP POLICY IF EXISTS "charges_update_own_org" ON charges;
DROP POLICY IF EXISTS "charges_delete_own_org" ON charges;

CREATE POLICY "charges_select_own_org" ON charges FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "charges_insert_own_org" ON charges FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "charges_update_own_org" ON charges FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "charges_delete_own_org" ON charges FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- monthly_goals
-- ----------------------------------------------------------------------------
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_goals_select_own_org" ON monthly_goals;
DROP POLICY IF EXISTS "monthly_goals_insert_own_org" ON monthly_goals;
DROP POLICY IF EXISTS "monthly_goals_update_own_org" ON monthly_goals;
DROP POLICY IF EXISTS "monthly_goals_delete_own_org" ON monthly_goals;

CREATE POLICY "monthly_goals_select_own_org" ON monthly_goals FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "monthly_goals_insert_own_org" ON monthly_goals FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "monthly_goals_update_own_org" ON monthly_goals FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "monthly_goals_delete_own_org" ON monthly_goals FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- dashboard_metric_cache
-- ----------------------------------------------------------------------------
ALTER TABLE dashboard_metric_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metric_cache FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_cache_select_own_org" ON dashboard_metric_cache;
DROP POLICY IF EXISTS "dashboard_cache_insert_own_org" ON dashboard_metric_cache;
DROP POLICY IF EXISTS "dashboard_cache_update_own_org" ON dashboard_metric_cache;
DROP POLICY IF EXISTS "dashboard_cache_delete_own_org" ON dashboard_metric_cache;

CREATE POLICY "dashboard_cache_select_own_org" ON dashboard_metric_cache FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_insert_own_org" ON dashboard_metric_cache FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_update_own_org" ON dashboard_metric_cache FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_delete_own_org" ON dashboard_metric_cache FOR DELETE USING (check_org_access(organization_id));

-- ============================================================================
-- PARTE 4: TABELAS DE JOIN (via relacionamento cascata)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- contact_tags (via contact)
-- ----------------------------------------------------------------------------
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_tags_select_via_contact" ON contact_tags;
DROP POLICY IF EXISTS "contact_tags_insert_via_contact" ON contact_tags;
DROP POLICY IF EXISTS "contact_tags_delete_via_contact" ON contact_tags;

CREATE POLICY "contact_tags_select_via_contact" ON contact_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_tags.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

CREATE POLICY "contact_tags_insert_via_contact" ON contact_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_tags.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

CREATE POLICY "contact_tags_delete_via_contact" ON contact_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_tags.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- list_contacts (via list)
-- ----------------------------------------------------------------------------
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_contacts_select_via_list" ON list_contacts;
DROP POLICY IF EXISTS "list_contacts_insert_via_list" ON list_contacts;
DROP POLICY IF EXISTS "list_contacts_delete_via_list" ON list_contacts;

CREATE POLICY "list_contacts_select_via_list" ON list_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lists
            WHERE lists.id = list_contacts.list_id
            AND check_org_access(lists.organization_id)
        )
    );

CREATE POLICY "list_contacts_insert_via_list" ON list_contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lists
            WHERE lists.id = list_contacts.list_id
            AND check_org_access(lists.organization_id)
        )
    );

CREATE POLICY "list_contacts_delete_via_list" ON list_contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lists
            WHERE lists.id = list_contacts.list_id
            AND check_org_access(lists.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- deal_activities (via deal)
-- ----------------------------------------------------------------------------
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_activities_select_via_deal" ON deal_activities;
DROP POLICY IF EXISTS "deal_activities_insert_via_deal" ON deal_activities;
DROP POLICY IF EXISTS "deal_activities_update_via_deal" ON deal_activities;
DROP POLICY IF EXISTS "deal_activities_delete_via_deal" ON deal_activities;

CREATE POLICY "deal_activities_select_via_deal" ON deal_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_activities.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

CREATE POLICY "deal_activities_insert_via_deal" ON deal_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_activities.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

CREATE POLICY "deal_activities_update_via_deal" ON deal_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_activities.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

CREATE POLICY "deal_activities_delete_via_deal" ON deal_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_activities.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- pipeline_stage_history (via deal)
-- ----------------------------------------------------------------------------
ALTER TABLE pipeline_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_history FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stage_history_select_via_deal" ON pipeline_stage_history;
DROP POLICY IF EXISTS "stage_history_insert_via_deal" ON pipeline_stage_history;
DROP POLICY IF EXISTS "stage_history_delete_via_deal" ON pipeline_stage_history;

CREATE POLICY "stage_history_select_via_deal" ON pipeline_stage_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = pipeline_stage_history.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

CREATE POLICY "stage_history_insert_via_deal" ON pipeline_stage_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = pipeline_stage_history.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

CREATE POLICY "stage_history_delete_via_deal" ON pipeline_stage_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = pipeline_stage_history.deal_id
            AND check_org_access(deals.organization_id)
        )
    );

-- ============================================================================
-- PARTE 5: VERIFICAÇÃO
-- ============================================================================

-- Verificar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
