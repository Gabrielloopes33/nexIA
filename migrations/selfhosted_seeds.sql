-- ============================================================
-- NEXIA - SEEDS PARA SUPABASE SELF-HOSTED
-- ============================================================
-- Executar após criar o schema:
-- psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -f migrations/selfhosted_seeds.sql
--
-- Este script insere dados iniciais essenciais para produção:
-- - Planos de assinatura (obrigatório)
-- - Cupons de desconto (recomendado)
-- - Templates de pipeline padrão (opcional)
-- - Tipos de integrações disponíveis (opcional)
-- ============================================================

-- ============================================================
-- 1. PLANOS DE ASSINATURA (OBRIGATÓRIO)
-- ============================================================
INSERT INTO "plans" ("id", "name", "description", "price_cents", "interval", "features", "limits", "status", "sort_order", "created_at", "updated_at")
VALUES 
    (
        '00000000-0000-0000-0000-000000000001',
        'Básico',
        'Ideal para começar',
        9700,
        'monthly',
        '["Até 1.000 contatos", "3 usuários", "1 pipeline", "Relatórios básicos", "Suporte por email"]'::jsonb,
        '{"max_contacts": 1000, "max_users": 3, "max_pipelines": 1, "max_schedules": 2, "storage_gb": 5}'::jsonb,
        'active',
        1,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Pro',
        'Para empresas em crescimento',
        19700,
        'monthly',
        '["Até 10.000 contatos", "10 usuários", "Pipelines ilimitados", "Relatórios avançados", "Suporte prioritário", "Automação de tarefas"]'::jsonb,
        '{"max_contacts": 10000, "max_users": 10, "max_pipelines": null, "max_schedules": 10, "storage_gb": 50}'::jsonb,
        'active',
        2,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'Enterprise',
        'Solução completa',
        49700,
        'monthly',
        '["Contatos ilimitados", "Usuários ilimitados", "Tudo ilimitado", "Relatórios personalizados", "Suporte dedicado 24/7", "SSO e segurança avançada"]'::jsonb,
        '{"max_contacts": null, "max_users": null, "max_pipelines": null, "max_schedules": null, "storage_gb": 500}'::jsonb,
        'active',
        3,
        NOW(),
        NOW()
    )
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "price_cents" = EXCLUDED."price_cents",
    "interval" = EXCLUDED."interval",
    "features" = EXCLUDED."features",
    "limits" = EXCLUDED."limits",
    "status" = EXCLUDED."status",
    "sort_order" = EXCLUDED."sort_order",
    "updated_at" = NOW();

-- ============================================================
-- 2. CUPONS DE DESCONTO (RECOMENDADO)
-- ============================================================
INSERT INTO "coupons" ("id", "code", "description", "discount_percent", "discount_cents", "valid_from", "valid_until", "max_uses", "uses_count", "max_uses_per_customer", "min_purchase_cents", "applies_to", "status", "created_at", "updated_at")
VALUES 
    (
        '00000000-0000-0000-0000-000000000010',
        'BEMVINDO20',
        '20% de desconto para novos clientes',
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
        'R$ 50 off no plano Pro',
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
    )
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "description" = EXCLUDED."description",
    "discount_percent" = EXCLUDED."discount_percent",
    "discount_cents" = EXCLUDED."discount_cents",
    "valid_from" = EXCLUDED."valid_from",
    "valid_until" = EXCLUDED."valid_until",
    "max_uses" = EXCLUDED."max_uses",
    "min_purchase_cents" = EXCLUDED."min_purchase_cents",
    "applies_to" = EXCLUDED."applies_to",
    "status" = EXCLUDED."status",
    "updated_at" = NOW();

-- ============================================================
-- 3. PIPELINE TEMPLATES PADRÃO (OPCIONAL)
-- ============================================================
-- Template: Funil de Vendas Padrão
INSERT INTO "pipeline_templates" ("id", "name", "category", "description", "is_default", "created_at", "updated_at")
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Funil de Vendas',
    'sales',
    'Template padrão para processo de vendas B2B',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT ("category") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "is_default" = EXCLUDED."is_default",
    "updated_at" = NOW();

-- Estágios do template Funil de Vendas
INSERT INTO "pipeline_template_stages" ("id", "template_id", "name", "position", "color", "probability", "is_closed", "description", "created_at", "updated_at")
VALUES 
    ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', 'Novo Lead', 1, '#6B7280', 10, FALSE, 'Leads recém-chegados que ainda não foram qualificados', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000020', 'Qualificação', 2, '#3B82F6', 25, FALSE, 'Analisando necessidades e perfil do cliente', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000020', 'Proposta', 3, '#8B5CF6', 50, FALSE, 'Proposta enviada, aguardando feedback', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000020', 'Negociação', 4, '#F59E0B', 75, FALSE, 'Discutindo termos e condições', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000020', 'Fechamento', 5, '#10B981', 100, FALSE, 'Revisão final do contrato', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000020', 'Ganho', 6, '#059669', 100, TRUE, 'Negócio fechado com sucesso', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000020', 'Perdido', 7, '#EF4444', 0, TRUE, 'Negócio perdido', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Template: Suporte ao Cliente
INSERT INTO "pipeline_templates" ("id", "name", "category", "description", "is_default", "created_at", "updated_at")
VALUES (
    '00000000-0000-0000-0000-000000000021',
    'Suporte ao Cliente',
    'support',
    'Template para gestão de tickets de suporte',
    FALSE,
    NOW(),
    NOW()
)
ON CONFLICT ("category") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "updated_at" = NOW();

-- Estágios do template Suporte
INSERT INTO "pipeline_template_stages" ("id", "template_id", "name", "position", "color", "probability", "is_closed", "description", "created_at", "updated_at")
VALUES 
    ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000021', 'Novo Ticket', 1, '#6B7280', 0, FALSE, 'Ticket recebido e aguardando triagem', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021', 'Em Análise', 2, '#3B82F6', 0, FALSE, 'Analisando o problema reportado', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000021', 'Em Atendimento', 3, '#8B5CF6', 0, FALSE, 'Resolvendo o ticket', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000021', 'Aguardando Cliente', 4, '#F59E0B', 0, FALSE, 'Aguardando resposta ou informação do cliente', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000021', 'Resolvido', 5, '#10B981', 100, TRUE, 'Ticket resolvido com sucesso', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000021', 'Cancelado', 6, '#EF4444', 0, TRUE, 'Ticket cancelado ou duplicado', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. TIPOS DE INTEGRAÇÕES DISPONÍVEIS (OPCIONAL)
-- ============================================================
-- Criar tabela de tipos de integrações se não existir
CREATE TABLE IF NOT EXISTS "integration_types" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" VARCHAR(50) UNIQUE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(100),
    "documentation_url" TEXT,
    "config_schema" JSONB DEFAULT '{}',
    "required_scopes" JSONB DEFAULT '[]',
    "is_premium" BOOLEAN DEFAULT FALSE,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "integration_types_type_idx" ON "integration_types"("type");
CREATE INDEX IF NOT EXISTS "integration_types_category_idx" ON "integration_types"("category");
CREATE INDEX IF NOT EXISTS "integration_types_is_active_idx" ON "integration_types"("is_active");

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_integration_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_integration_types_updated_at ON "integration_types";
CREATE TRIGGER update_integration_types_updated_at
    BEFORE UPDATE ON "integration_types"
    FOR EACH ROW EXECUTE FUNCTION update_integration_types_updated_at();

-- Inserir tipos de integrações disponíveis
INSERT INTO "integration_types" ("id", "type", "name", "description", "category", "icon", "documentation_url", "config_schema", "required_scopes", "is_premium", "is_active", "created_at", "updated_at")
VALUES 
    (
        '00000000-0000-0000-0000-000000000050',
        'zapier',
        'Zapier',
        'Automatize workflows conectando com 5.000+ aplicativos',
        'automation',
        'Zapier',
        'https://zapier.com/apps/nexia',
        '{"api_key": {"type": "string", "required": true, "label": "API Key"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000051',
        'n8n',
        'n8n',
        'Automação de workflows open-source e self-hosted',
        'automation',
        'n8n',
        'https://docs.n8n.io/',
        '{"webhook_url": {"type": "string", "required": true, "label": "Webhook URL"}, "api_key": {"type": "string", "required": false, "label": "API Key (opcional)"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000052',
        'make',
        'Make (Integromat)',
        'Automação visual de workflows e integrações',
        'automation',
        'Make',
        'https://www.make.com/en/integrations',
        '{"api_key": {"type": "string", "required": true, "label": "API Key"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000053',
        'google_sheets',
        'Google Sheets',
        'Sincronize dados com planilhas do Google',
        'productivity',
        'GoogleSheets',
        'https://developers.google.com/sheets/api',
        '{"spreadsheet_id": {"type": "string", "required": true, "label": "Spreadsheet ID"}, "sheet_name": {"type": "string", "required": false, "label": "Nome da Aba"}}'::jsonb,
        '["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.readonly"]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000054',
        'slack',
        'Slack',
        'Receba notificações e gerencie comunicação no Slack',
        'communication',
        'Slack',
        'https://api.slack.com/',
        '{"webhook_url": {"type": "string", "required": true, "label": "Webhook URL"}, "channel": {"type": "string", "required": false, "label": "Canal (opcional)"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000055',
        'typebot',
        'Typebot',
        'Crie chatbots visuais e integre com sua automação',
        'automation',
        'Typebot',
        'https://docs.typebot.io/',
        '{"public_id": {"type": "string", "required": true, "label": "Public ID"}, "webhook_url": {"type": "string", "required": false, "label": "Webhook URL"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000056',
        'evolution_api',
        'Evolution API',
        'Integração WhatsApp via Evolution API',
        'whatsapp',
        'WhatsApp',
        'https://doc.evolution-api.com/',
        '{"instance": {"type": "string", "required": true, "label": "Nome da Instância"}, "api_key": {"type": "string", "required": true, "label": "API Key"}, "base_url": {"type": "string", "required": true, "label": "URL Base"}}'::jsonb,
        '[]'::jsonb,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000057',
        'webhook',
        'Webhook Personalizado',
        'Envie eventos para qualquer endpoint HTTP',
        'automation',
        'Webhook',
        NULL,
        '{"url": {"type": "string", "required": true, "label": "URL do Webhook"}, "method": {"type": "select", "required": true, "label": "Método HTTP", "options": ["POST", "PUT", "PATCH"]}, "headers": {"type": "object", "required": false, "label": "Headers Personalizados"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000058',
        'openai',
        'OpenAI',
        'Integração com IA para respostas automáticas',
        'ai',
        'OpenAI',
        'https://platform.openai.com/docs',
        '{"api_key": {"type": "string", "required": true, "label": "API Key"}, "model": {"type": "select", "required": false, "label": "Modelo", "options": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"], "default": "gpt-3.5-turbo"}}'::jsonb,
        '[]'::jsonb,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000059',
        'stripe',
        'Stripe',
        'Processamento de pagamentos e assinaturas',
        'payment',
        'Stripe',
        'https://stripe.com/docs',
        '{"publishable_key": {"type": "string", "required": true, "label": "Publishable Key"}, "secret_key": {"type": "string", "required": true, "label": "Secret Key", "secret": true}, "webhook_secret": {"type": "string", "required": false, "label": "Webhook Secret"}}'::jsonb,
        '[]'::jsonb,
        FALSE,
        TRUE,
        NOW(),
        NOW()
    )
ON CONFLICT ("type") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "category" = EXCLUDED."category",
    "icon" = EXCLUDED."icon",
    "documentation_url" = EXCLUDED."documentation_url",
    "config_schema" = EXCLUDED."config_schema",
    "required_scopes" = EXCLUDED."required_scopes",
    "is_premium" = EXCLUDED."is_premium",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = NOW();

-- ============================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================================
SELECT '=== SEEDS APLICADOS COM SUCESSO ===' AS status;

SELECT 'Planos:' AS categoria, COUNT(*) AS total FROM "plans"
UNION ALL
SELECT 'Cupons:', COUNT(*) FROM "coupons"
UNION ALL
SELECT 'Pipeline Templates:', COUNT(*) FROM "pipeline_templates"
UNION ALL
SELECT 'Pipeline Template Stages:', COUNT(*) FROM "pipeline_template_stages"
UNION ALL
SELECT 'Tipos de Integrações:', COUNT(*) FROM "integration_types";

-- Listar planos criados
SELECT 'Planos disponíveis:' AS info;
SELECT name, description, price_cents/100.0 AS price_brl, interval, status FROM "plans" ORDER BY sort_order;

-- Listar cupons criados
SELECT 'Cupons disponíveis:' AS info;
SELECT code, description, discount_percent, discount_cents/100.0 AS discount_brl, status FROM "coupons";
