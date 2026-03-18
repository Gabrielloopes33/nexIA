-- ============================================================================
-- FASE 2 - Reset e Recriação do RLS
-- ============================================================================
-- Limpa tudo e recria do zero (use se teve erros anteriores)
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPAR TUDO (POLÍTICAS E FUNÇÕES)
-- ============================================================================

-- Dropar todas as políticas de todas as tabelas
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Dropar função antiga (todos os tipos)
DROP FUNCTION IF EXISTS public.check_org_access(uuid);
DROP FUNCTION IF EXISTS public.check_org_access(text);

-- ============================================================================
-- PARTE 2: FUNÇÃO UTILITÁRIA
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
-- PARTE 3: TABELAS CRÍTICAS
-- ============================================================================

-- contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select_own_org" ON contacts FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "contacts_insert_own_org" ON contacts FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "contacts_update_own_org" ON contacts FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "contacts_delete_own_org" ON contacts FOR DELETE USING (check_org_access(organization_id));

-- deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals FORCE ROW LEVEL SECURITY;
CREATE POLICY "deals_select_own_org" ON deals FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "deals_insert_own_org" ON deals FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "deals_update_own_org" ON deals FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "deals_delete_own_org" ON deals FOR DELETE USING (check_org_access(organization_id));

-- conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select_own_org" ON conversations FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "conversations_insert_own_org" ON conversations FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "conversations_update_own_org" ON conversations FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "conversations_delete_own_org" ON conversations FOR DELETE USING (check_org_access(organization_id));

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_via_conversation" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND check_org_access(conversations.organization_id)));
CREATE POLICY "messages_insert_via_conversation" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND check_org_access(conversations.organization_id)));
CREATE POLICY "messages_update_via_conversation" ON messages FOR UPDATE USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND check_org_access(conversations.organization_id)));
CREATE POLICY "messages_delete_via_conversation" ON messages FOR DELETE USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND check_org_access(conversations.organization_id)));

-- ============================================================================
-- PARTE 4: TABELAS IMPORTANTES
-- ============================================================================

-- schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules FORCE ROW LEVEL SECURITY;
CREATE POLICY "schedules_select_own_org" ON schedules FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "schedules_insert_own_org" ON schedules FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "schedules_update_own_org" ON schedules FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "schedules_delete_own_org" ON schedules FOR DELETE USING (check_org_access(organization_id));

-- tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags FORCE ROW LEVEL SECURITY;
CREATE POLICY "tags_select_own_org" ON tags FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "tags_insert_own_org" ON tags FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "tags_update_own_org" ON tags FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "tags_delete_own_org" ON tags FOR DELETE USING (check_org_access(organization_id));

-- lists
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists FORCE ROW LEVEL SECURITY;
CREATE POLICY "lists_select_own_org" ON lists FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "lists_insert_own_org" ON lists FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "lists_update_own_org" ON lists FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "lists_delete_own_org" ON lists FOR DELETE USING (check_org_access(organization_id));

-- segments
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments FORCE ROW LEVEL SECURITY;
CREATE POLICY "segments_select_own_org" ON segments FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "segments_insert_own_org" ON segments FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "segments_update_own_org" ON segments FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "segments_delete_own_org" ON segments FOR DELETE USING (check_org_access(organization_id));

-- whatsapp_cloud_instances
ALTER TABLE whatsapp_cloud_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_instances FORCE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_instances_select_own_org" ON whatsapp_cloud_instances FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_insert_own_org" ON whatsapp_cloud_instances FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_update_own_org" ON whatsapp_cloud_instances FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "whatsapp_instances_delete_own_org" ON whatsapp_cloud_instances FOR DELETE USING (check_org_access(organization_id));

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own_org" ON subscriptions FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "subscriptions_insert_own_org" ON subscriptions FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "subscriptions_update_own_org" ON subscriptions FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "subscriptions_delete_own_org" ON subscriptions FOR DELETE USING (check_org_access(organization_id));

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select_own_org" ON invoices FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "invoices_insert_own_org" ON invoices FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "invoices_update_own_org" ON invoices FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "invoices_delete_own_org" ON invoices FOR DELETE USING (check_org_access(organization_id));

-- charges
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges FORCE ROW LEVEL SECURITY;
CREATE POLICY "charges_select_own_org" ON charges FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "charges_insert_own_org" ON charges FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "charges_update_own_org" ON charges FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "charges_delete_own_org" ON charges FOR DELETE USING (check_org_access(organization_id));

-- monthly_goals
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals FORCE ROW LEVEL SECURITY;
CREATE POLICY "monthly_goals_select_own_org" ON monthly_goals FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "monthly_goals_insert_own_org" ON monthly_goals FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "monthly_goals_update_own_org" ON monthly_goals FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "monthly_goals_delete_own_org" ON monthly_goals FOR DELETE USING (check_org_access(organization_id));

-- dashboard_metric_cache
ALTER TABLE dashboard_metric_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metric_cache FORCE ROW LEVEL SECURITY;
CREATE POLICY "dashboard_cache_select_own_org" ON dashboard_metric_cache FOR SELECT USING (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_insert_own_org" ON dashboard_metric_cache FOR INSERT WITH CHECK (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_update_own_org" ON dashboard_metric_cache FOR UPDATE USING (check_org_access(organization_id));
CREATE POLICY "dashboard_cache_delete_own_org" ON dashboard_metric_cache FOR DELETE USING (check_org_access(organization_id));

-- ============================================================================
-- PARTE 5: TABELAS DE JOIN
-- ============================================================================

-- contact_tags
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags FORCE ROW LEVEL SECURITY;
CREATE POLICY "contact_tags_select_via_contact" ON contact_tags FOR SELECT USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND check_org_access(contacts.organization_id)));
CREATE POLICY "contact_tags_insert_via_contact" ON contact_tags FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND check_org_access(contacts.organization_id)));
CREATE POLICY "contact_tags_delete_via_contact" ON contact_tags FOR DELETE USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_tags.contact_id AND check_org_access(contacts.organization_id)));

-- list_contacts
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts FORCE ROW LEVEL SECURITY;
CREATE POLICY "list_contacts_select_via_list" ON list_contacts FOR SELECT USING (EXISTS (SELECT 1 FROM lists WHERE lists.id = list_contacts.list_id AND check_org_access(lists.organization_id)));
CREATE POLICY "list_contacts_insert_via_list" ON list_contacts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM lists WHERE lists.id = list_contacts.list_id AND check_org_access(lists.organization_id)));
CREATE POLICY "list_contacts_delete_via_list" ON list_contacts FOR DELETE USING (EXISTS (SELECT 1 FROM lists WHERE lists.id = list_contacts.list_id AND check_org_access(lists.organization_id)));

-- deal_activities
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities FORCE ROW LEVEL SECURITY;
CREATE POLICY "deal_activities_select_via_deal" ON deal_activities FOR SELECT USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND check_org_access(deals.organization_id)));
CREATE POLICY "deal_activities_insert_via_deal" ON deal_activities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND check_org_access(deals.organization_id)));
CREATE POLICY "deal_activities_update_via_deal" ON deal_activities FOR UPDATE USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND check_org_access(deals.organization_id)));
CREATE POLICY "deal_activities_delete_via_deal" ON deal_activities FOR DELETE USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = deal_activities.deal_id AND check_org_access(deals.organization_id)));

-- pipeline_stage_history
ALTER TABLE pipeline_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_history FORCE ROW LEVEL SECURITY;
CREATE POLICY "stage_history_select_via_deal" ON pipeline_stage_history FOR SELECT USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = pipeline_stage_history.deal_id AND check_org_access(deals.organization_id)));
CREATE POLICY "stage_history_insert_via_deal" ON pipeline_stage_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM deals WHERE deals.id = pipeline_stage_history.deal_id AND check_org_access(deals.organization_id)));
CREATE POLICY "stage_history_delete_via_deal" ON pipeline_stage_history FOR DELETE USING (EXISTS (SELECT 1 FROM deals WHERE deals.id = pipeline_stage_history.deal_id AND check_org_access(deals.organization_id)));

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
    tablename,
    count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
