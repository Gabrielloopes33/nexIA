-- Seeds para Supabase Self-Hosted (VERSÃO FINAL)
-- Ordem corrigida: cria tabelas primeiro, depois limpa e insere

-- ============================================
-- 0. CRIAR TABELAS QUE NÃO EXISTEM
-- ============================================

-- Criar tabela de tipos de integração se não existir
CREATE TABLE IF NOT EXISTS integration_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    config_schema JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at para integration_types
DROP TRIGGER IF EXISTS update_integration_types_updated_at ON integration_types;
CREATE TRIGGER update_integration_types_updated_at
    BEFORE UPDATE ON integration_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 1. LIMPAR DADOS EXISTENTES
-- ============================================

-- Limpar na ordem correta (respeitando FKs)
DELETE FROM subscription_coupons WHERE coupon_id IN (SELECT id FROM coupons WHERE code IN ('BEMVINDO20', 'PRO50OFF'));
DELETE FROM coupons WHERE code IN ('BEMVINDO20', 'PRO50OFF');
DELETE FROM plans WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');
DELETE FROM pipeline_template_stages WHERE template_id IN (SELECT id FROM pipeline_templates WHERE id IN ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000021'));
DELETE FROM pipeline_templates WHERE id IN ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000021');
DELETE FROM integration_types WHERE type IN ('zapier', 'n8n', 'make', 'google_sheets', 'slack', 'typebot', 'evolution_api', 'webhook', 'openai', 'stripe');

-- ============================================
-- 2. INSERIR PLANOS DE ASSINATURA
-- ============================================

INSERT INTO plans (id, name, description, price_cents, interval, features, limits, status, sort_order, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'Básico', 
    'Ideal para pequenas empresas que estão começando',
    9700, 
    'monthly',
    '["Até 1.000 contatos", "Até 3 usuários", "1 pipeline de vendas", "Relatórios básicos", "Suporte por email", "Integrações básicas"]'::jsonb,
    '{"max_contacts": 1000, "max_users": 3, "max_pipelines": 1, "max_schedules": 2, "storage_gb": 5}'::jsonb,
    'active',
    1,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000002', 
    'Pro', 
    'Perfeito para empresas em crescimento',
    19700, 
    'monthly',
    '["Até 10.000 contatos", "Até 10 usuários", "Pipelines ilimitados", "Relatórios avançados", "Suporte prioritário", "Todas as integrações", "Automação de tarefas", "API completa"]'::jsonb,
    '{"max_contacts": 10000, "max_users": 10, "max_pipelines": null, "max_schedules": 10, "storage_gb": 50}'::jsonb,
    'active',
    2,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003', 
    'Enterprise', 
    'Para grandes organizações com necessidades específicas',
    49700, 
    'monthly',
    '["Contatos ilimitados", "Usuários ilimitados", "Pipelines ilimitados", "Relatórios personalizados", "Suporte dedicado 24/7", "Todas as integrações", "Automação avançada", "API completa", "SSO e segurança avançada", "Onboarding dedicado"]'::jsonb,
    '{"max_contacts": null, "max_users": null, "max_pipelines": null, "max_schedules": null, "storage_gb": 500}'::jsonb,
    'active',
    3,
    NOW(),
    NOW()
  );

-- ============================================
-- 3. INSERIR CUPONS DE DESCONTO
-- ============================================

INSERT INTO coupons (id, code, description, discount_percent, discount_cents, valid_from, valid_until, max_uses, uses_count, max_uses_per_customer, min_purchase_cents, applies_to, status, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000010',
    'BEMVINDO20',
    '20% de desconto para novos clientes no primeiro mês',
    20,
    NULL,
    NOW(),
    NOW() + INTERVAL '1 year',
    100,
    0,
    1,
    9700,
    '["all_plans"]'::jsonb,
    'active',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'PRO50OFF',
    'R$ 50,00 de desconto na assinatura Pro',
    NULL,
    5000,
    NOW(),
    NOW() + INTERVAL '6 months',
    50,
    0,
    1,
    19700,
    '["00000000-0000-0000-0000-000000000002"]'::jsonb,
    'active',
    NOW(),
    NOW()
  );

-- ============================================
-- 4. INSERIR PIPELINE TEMPLATES
-- ============================================

INSERT INTO pipeline_templates (id, name, category, description, is_default, created_at, updated_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000020',
    'Funil de Vendas',
    'sales',
    'Template padrão para processo comercial',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    'Suporte ao Cliente',
    'support',
    'Template para gestão de tickets de suporte',
    false,
    NOW(),
    NOW()
  );

-- ============================================
-- 5. INSERIR TIPOS DE INTEGRAÇÕES
-- ============================================

INSERT INTO integration_types (id, type, name, description, category, icon, is_active, config_schema)
VALUES 
  ('00000000-0000-0000-0000-000000000100', 'zapier', 'Zapier', 'Integre com milhares de apps via Zapier', 'automation', 'zapier', true, '{"webhook_url": "string"}'),
  ('00000000-0000-0000-0000-000000000101', 'n8n', 'n8n', 'Automação de workflows com n8n', 'automation', 'n8n', true, '{"webhook_url": "string"}'),
  ('00000000-0000-0000-0000-000000000102', 'make', 'Make', 'Integromat/Make para automações', 'automation', 'make', true, '{"webhook_url": "string"}'),
  ('00000000-0000-0000-0000-000000000103', 'google_sheets', 'Google Sheets', 'Sincronização com planilhas Google', 'productivity', 'google', true, '{"sheet_id": "string", "range": "string"}'),
  ('00000000-0000-0000-0000-000000000104', 'slack', 'Slack', 'Notificações e integração com Slack', 'communication', 'slack', true, '{"webhook_url": "string", "channel": "string"}'),
  ('00000000-0000-0000-0000-000000000105', 'typebot', 'Typebot', 'Chatbots com Typebot', 'chatbot', 'typebot', true, '{"api_key": "string"}'),
  ('00000000-0000-0000-0000-000000000106', 'evolution_api', 'Evolution API', 'Integração WhatsApp via Evolution', 'whatsapp', 'whatsapp', true, '{"api_key": "string", "instance": "string"}'),
  ('00000000-0000-0000-0000-000000000107', 'webhook', 'Webhook Genérico', 'Webhook customizado para integrações', 'custom', 'webhook', true, '{"url": "string", "headers": "object"}'),
  ('00000000-0000-0000-0000-000000000108', 'openai', 'OpenAI', 'Integração com OpenAI/ChatGPT', 'ai', 'openai', true, '{"api_key": "string", "model": "string"}'),
  ('00000000-0000-0000-0000-000000000109', 'stripe', 'Stripe', 'Pagamentos e assinaturas via Stripe', 'payment', 'stripe', true, '{"api_key": "string", "webhook_secret": "string"}');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'Planos criados:' as info, COUNT(*) as total FROM plans;
SELECT 'Cupons criados:' as info, COUNT(*) as total FROM coupons;
SELECT 'Templates criados:' as info, COUNT(*) as total FROM pipeline_templates;
SELECT 'Tipos de integrações:' as info, COUNT(*) as total FROM integration_types;
