-- ============================================================================
-- FASE 2 - Row Level Security (RLS) Migration
-- ============================================================================
-- Descrição: Implementa políticas RLS em todas as tabelas críticas
-- Data: 2026-03-18
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
-- transcriptions
-- ----------------------------------------------------------------------------
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transcriptions_select_own_org" ON transcriptions;
DROP POLICY IF EXISTS "transcriptions_insert_own_org" ON transcriptions;
DROP POLICY IF EXISTS "transcriptions_update_own_org" ON transcriptions;
DROP POLICY IF EXISTS "transcriptions_delete_own_org" ON transcriptions;

CREATE POLICY "transcriptions_select_own_org" ON transcriptions FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "transcriptions_insert_own_org" ON transcriptions FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "transcriptions_update_own_org" ON transcriptions FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "transcriptions_delete_own_org" ON transcriptions FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- ai_insights
-- ----------------------------------------------------------------------------
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_insights_select_own_org" ON ai_insights;
DROP POLICY IF EXISTS "ai_insights_insert_own_org" ON ai_insights;
DROP POLICY IF EXISTS "ai_insights_update_own_org" ON ai_insights;
DROP POLICY IF EXISTS "ai_insights_delete_own_org" ON ai_insights;

CREATE POLICY "ai_insights_select_own_org" ON ai_insights FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "ai_insights_insert_own_org" ON ai_insights FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "ai_insights_update_own_org" ON ai_insights FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "ai_insights_delete_own_org" ON ai_insights FOR DELETE USING (check_org_access(organization_id));

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
-- instagram_instances
-- ----------------------------------------------------------------------------
ALTER TABLE instagram_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_instances FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instagram_instances_select_own_org" ON instagram_instances;
DROP POLICY IF EXISTS "instagram_instances_insert_own_org" ON instagram_instances;
DROP POLICY IF EXISTS "instagram_instances_update_own_org" ON instagram_instances;
DROP POLICY IF EXISTS "instagram_instances_delete_own_org" ON instagram_instances;

CREATE POLICY "instagram_instances_select_own_org" ON instagram_instances FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "instagram_instances_insert_own_org" ON instagram_instances FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "instagram_instances_update_own_org" ON instagram_instances FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "instagram_instances_delete_own_org" ON instagram_instances FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- integrations
-- ----------------------------------------------------------------------------
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integrations_select_own_org" ON integrations;
DROP POLICY IF EXISTS "integrations_insert_own_org" ON integrations;
DROP POLICY IF EXISTS "integrations_update_own_org" ON integrations;
DROP POLICY IF EXISTS "integrations_delete_own_org" ON integrations;

CREATE POLICY "integrations_select_own_org" ON integrations FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "integrations_insert_own_org" ON integrations FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "integrations_update_own_org" ON integrations FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "integrations_delete_own_org" ON integrations FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- integration_activity_logs
-- ----------------------------------------------------------------------------
ALTER TABLE integration_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_activity_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_logs_select_own_org" ON integration_activity_logs;
DROP POLICY IF EXISTS "integration_logs_insert_own_org" ON integration_activity_logs;
DROP POLICY IF EXISTS "integration_logs_update_own_org" ON integration_activity_logs;
DROP POLICY IF EXISTS "integration_logs_delete_own_org" ON integration_activity_logs;

CREATE POLICY "integration_logs_select_own_org" ON integration_activity_logs FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "integration_logs_insert_own_org" ON integration_activity_logs FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "integration_logs_update_own_org" ON integration_activity_logs FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "integration_logs_delete_own_org" ON integration_activity_logs FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- meta_webhook_logs
-- ----------------------------------------------------------------------------
ALTER TABLE meta_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_webhook_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_select_own_org" ON meta_webhook_logs;
DROP POLICY IF EXISTS "webhook_logs_insert_own_org" ON meta_webhook_logs;
DROP POLICY IF EXISTS "webhook_logs_update_own_org" ON meta_webhook_logs;
DROP POLICY IF EXISTS "webhook_logs_delete_own_org" ON meta_webhook_logs;

CREATE POLICY "webhook_logs_select_own_org" ON meta_webhook_logs FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "webhook_logs_insert_own_org" ON meta_webhook_logs FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "webhook_logs_update_own_org" ON meta_webhook_logs FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "webhook_logs_delete_own_org" ON meta_webhook_logs FOR DELETE USING (check_org_access(organization_id));

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
-- contact_custom_field_values (via contact)
-- ----------------------------------------------------------------------------
ALTER TABLE contact_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_custom_field_values FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_fields_select_via_contact" ON contact_custom_field_values;
DROP POLICY IF EXISTS "custom_fields_insert_via_contact" ON contact_custom_field_values;
DROP POLICY IF EXISTS "custom_fields_update_via_contact" ON contact_custom_field_values;
DROP POLICY IF EXISTS "custom_fields_delete_via_contact" ON contact_custom_field_values;

CREATE POLICY "custom_fields_select_via_contact" ON contact_custom_field_values
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_custom_field_values.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

CREATE POLICY "custom_fields_insert_via_contact" ON contact_custom_field_values
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_custom_field_values.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

CREATE POLICY "custom_fields_update_via_contact" ON contact_custom_field_values
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_custom_field_values.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

CREATE POLICY "custom_fields_delete_via_contact" ON contact_custom_field_values
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_custom_field_values.contact_id
            AND check_org_access(contacts.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- custom_field_definitions
-- ----------------------------------------------------------------------------
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_field_defs_select_own_org" ON custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_defs_insert_own_org" ON custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_defs_update_own_org" ON custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_defs_delete_own_org" ON custom_field_definitions;

CREATE POLICY "custom_field_defs_select_own_org" ON custom_field_definitions FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "custom_field_defs_insert_own_org" ON custom_field_definitions FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "custom_field_defs_update_own_org" ON custom_field_definitions FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "custom_field_defs_delete_own_org" ON custom_field_definitions FOR DELETE USING (check_org_access(organization_id));

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
-- PARTE 5: TABELAS COMPLEMENTARES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- organization_units
-- ----------------------------------------------------------------------------
ALTER TABLE organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_units FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_units_select_own_org" ON organization_units;
DROP POLICY IF EXISTS "org_units_insert_own_org" ON organization_units;
DROP POLICY IF EXISTS "org_units_update_own_org" ON organization_units;
DROP POLICY IF EXISTS "org_units_delete_own_org" ON organization_units;

CREATE POLICY "org_units_select_own_org" ON organization_units FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "org_units_insert_own_org" ON organization_units FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "org_units_update_own_org" ON organization_units FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "org_units_delete_own_org" ON organization_units FOR DELETE USING (check_org_access(organization_id));

-- ----------------------------------------------------------------------------
-- whatsapp_cloud_templates
-- ----------------------------------------------------------------------------
ALTER TABLE whatsapp_cloud_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_templates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_templates_select_via_instance" ON whatsapp_cloud_templates;
DROP POLICY IF EXISTS "whatsapp_templates_insert_via_instance" ON whatsapp_cloud_templates;
DROP POLICY IF EXISTS "whatsapp_templates_update_via_instance" ON whatsapp_cloud_templates;
DROP POLICY IF EXISTS "whatsapp_templates_delete_via_instance" ON whatsapp_cloud_templates;

CREATE POLICY "whatsapp_templates_select_via_instance" ON whatsapp_cloud_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_templates.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

CREATE POLICY "whatsapp_templates_insert_via_instance" ON whatsapp_cloud_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_templates.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

CREATE POLICY "whatsapp_templates_update_via_instance" ON whatsapp_cloud_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_templates.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

CREATE POLICY "whatsapp_templates_delete_via_instance" ON whatsapp_cloud_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_templates.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- whatsapp_cloud_logs
-- ----------------------------------------------------------------------------
ALTER TABLE whatsapp_cloud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_logs_select_via_instance" ON whatsapp_cloud_logs;
DROP POLICY IF EXISTS "whatsapp_logs_insert_via_instance" ON whatsapp_cloud_logs;
DROP POLICY IF EXISTS "whatsapp_logs_delete_via_instance" ON whatsapp_cloud_logs;

CREATE POLICY "whatsapp_logs_select_via_instance" ON whatsapp_cloud_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_logs.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

CREATE POLICY "whatsapp_logs_insert_via_instance" ON whatsapp_cloud_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_logs.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

CREATE POLICY "whatsapp_logs_delete_via_instance" ON whatsapp_cloud_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM whatsapp_cloud_instances
            WHERE whatsapp_cloud_instances.id = whatsapp_cloud_logs.instance_id
            AND check_org_access(whatsapp_cloud_instances.organization_id)
        )
    );

-- ----------------------------------------------------------------------------
-- pending_form_deliveries
-- ----------------------------------------------------------------------------
ALTER TABLE pending_form_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_form_deliveries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_forms_select_own_org" ON pending_form_deliveries;
DROP POLICY IF EXISTS "pending_forms_insert_own_org" ON pending_form_deliveries;
DROP POLICY IF EXISTS "pending_forms_update_own_org" ON pending_form_deliveries;
DROP POLICY IF EXISTS "pending_forms_delete_own_org" ON pending_form_deliveries;

CREATE POLICY "pending_forms_select_own_org" ON pending_form_deliveries FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "pending_forms_insert_own_org" ON pending_form_deliveries FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "pending_forms_update_own_org" ON pending_form_deliveries FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "pending_forms_delete_own_org" ON pending_form_deliveries FOR DELETE USING (check_org_access(organization_id));

-- ============================================================================
-- PARTE 6: VERIFICAÇÃO
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
