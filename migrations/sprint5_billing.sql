-- Sprint 5: Migration para tabelas de Cobranças e Assinaturas
-- Execute no SQL Editor do Supabase
-- Tabelas: plans, subscriptions, invoices, charges, coupons

-- ============================================
-- FUNÇÃO: update_updated_at_column (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELA: plans
-- Planos de assinatura disponíveis
-- ============================================
CREATE TABLE IF NOT EXISTS "plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "interval" VARCHAR(20) NOT NULL CHECK ("interval" IN ('monthly', 'yearly')),
    "features" JSONB DEFAULT '[]',
    "limits" JSONB DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'archived')),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Indexes para plans
CREATE INDEX IF NOT EXISTS "plans_status_idx" ON "plans"("status");
CREATE INDEX IF NOT EXISTS "plans_interval_idx" ON "plans"("interval");
CREATE INDEX IF NOT EXISTS "plans_sort_order_idx" ON "plans"("sort_order");

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON "plans"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: subscriptions
-- Assinaturas das organizações
-- ============================================
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
    "current_period_start" TIMESTAMPTZ NOT NULL,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "trial_start" TIMESTAMPTZ,
    "trial_end" TIMESTAMPTZ,
    "canceled_at" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_subscription_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- Indexes para subscriptions
CREATE INDEX IF NOT EXISTS "subscriptions_organization_id_idx" ON "subscriptions"("organization_id");
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");

-- Foreign Keys para subscriptions
ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "plans"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON "subscriptions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: invoices
-- Faturas das assinaturas
-- ============================================
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID,
    "organization_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('pending', 'paid', 'failed', 'canceled', 'refunded', 'uncollectible')),
    "due_date" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "invoice_url" TEXT,
    "pdf_url" TEXT,
    "stripe_invoice_id" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255),
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Indexes para invoices
CREATE INDEX IF NOT EXISTS "invoices_subscription_id_idx" ON "invoices"("subscription_id");
CREATE INDEX IF NOT EXISTS "invoices_organization_id_idx" ON "invoices"("organization_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices"("due_date");
CREATE INDEX IF NOT EXISTS "invoices_stripe_invoice_id_idx" ON "invoices"("stripe_invoice_id");
CREATE INDEX IF NOT EXISTS "invoices_created_at_idx" ON "invoices"("created_at");

-- Foreign Keys para invoices
ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger para updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON "invoices"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: charges
-- Cobranças individuais
-- ============================================
CREATE TABLE IF NOT EXISTS "charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('pending', 'paid', 'failed', 'canceled', 'refunded', 'disputed')),
    "payment_method" VARCHAR(50) CHECK ("payment_method" IN ('credit_card', 'debit_card', 'boleto', 'pix', 'bank_transfer', 'wallet')),
    "paid_at" TIMESTAMPTZ,
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "failure_message" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- Indexes para charges
CREATE INDEX IF NOT EXISTS "charges_organization_id_idx" ON "charges"("organization_id");
CREATE INDEX IF NOT EXISTS "charges_invoice_id_idx" ON "charges"("invoice_id");
CREATE INDEX IF NOT EXISTS "charges_status_idx" ON "charges"("status");
CREATE INDEX IF NOT EXISTS "charges_payment_method_idx" ON "charges"("payment_method");
CREATE INDEX IF NOT EXISTS "charges_created_at_idx" ON "charges"("created_at");
CREATE INDEX IF NOT EXISTS "charges_stripe_payment_intent_id_idx" ON "charges"("stripe_payment_intent_id");

-- Foreign Keys para charges
ALTER TABLE "charges"
    ADD CONSTRAINT "charges_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "charges"
    ADD CONSTRAINT "charges_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Trigger para updated_at
CREATE TRIGGER update_charges_updated_at
    BEFORE UPDATE ON "charges"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: coupons
-- Cupons de desconto
-- ============================================
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_percent" INTEGER CHECK ("discount_percent" >= 0 AND "discount_percent" <= 100),
    "discount_cents" INTEGER CHECK ("discount_cents" >= 0),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "valid_from" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMPTZ,
    "max_uses" INTEGER,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_customer" INTEGER NOT NULL DEFAULT 1,
    "min_purchase_cents" INTEGER DEFAULT 0,
    "applies_to" JSONB DEFAULT '["all_plans"]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'expired')),
    "stripe_coupon_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "coupons_code_key" UNIQUE ("code")
);

-- Indexes para coupons
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_status_idx" ON "coupons"("status");
CREATE INDEX IF NOT EXISTS "coupons_valid_until_idx" ON "coupons"("valid_until");

-- Trigger para updated_at
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON "coupons"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: subscription_coupons (relacionamento N:M)
-- Cupons aplicados em assinaturas
-- ============================================
CREATE TABLE IF NOT EXISTS "subscription_coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "discount_applied_cents" INTEGER NOT NULL DEFAULT 0,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_coupons_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_coupons_subscription_id_coupon_id_key" UNIQUE ("subscription_id", "coupon_id")
);

-- Indexes para subscription_coupons
CREATE INDEX IF NOT EXISTS "subscription_coupons_subscription_id_idx" ON "subscription_coupons"("subscription_id");
CREATE INDEX IF NOT EXISTS "subscription_coupons_coupon_id_idx" ON "subscription_coupons"("coupon_id");

-- Foreign Keys para subscription_coupons
ALTER TABLE "subscription_coupons"
    ADD CONSTRAINT "subscription_coupons_subscription_id_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_coupons"
    ADD CONSTRAINT "subscription_coupons_coupon_id_fkey"
    FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SEED: Planos de assinatura
-- ============================================
INSERT INTO "plans" ("id", "name", "description", "price_cents", "interval", "features", "limits", "status", "sort_order", "created_at", "updated_at")
VALUES 
    (
        '00000000-0000-0000-0000-000000000010',
        'Básico',
        'Ideal para pequenas empresas que estão começando',
        9700,
        'monthly',
        '[
            "Até 1.000 contatos",
            "Até 3 usuários",
            "1 pipeline de vendas",
            "Relatórios básicos",
            "Suporte por email",
            "Integrações básicas"
        ]'::jsonb,
        '{
            "max_contacts": 1000,
            "max_users": 3,
            "max_pipelines": 1,
            "max_schedules": 2,
            "storage_gb": 5
        }'::jsonb,
        'active',
        1,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000011',
        'Pro',
        'Perfeito para empresas em crescimento',
        19700,
        'monthly',
        '[
            "Até 10.000 contatos",
            "Até 10 usuários",
            "Pipelines ilimitados",
            "Relatórios avançados",
            "Suporte prioritário",
            "Todas as integrações",
            "Automação de tarefas",
            "API completa"
        ]'::jsonb,
        '{
            "max_contacts": 10000,
            "max_users": 10,
            "max_pipelines": null,
            "max_schedules": 10,
            "storage_gb": 50
        }'::jsonb,
        'active',
        2,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000012',
        'Enterprise',
        'Para grandes organizações com necessidades específicas',
        49700,
        'monthly',
        '[
            "Contatos ilimitados",
            "Usuários ilimitados",
            "Pipelines ilimitados",
            "Relatórios personalizados",
            "Suporte dedicado 24/7",
            "Todas as integrações",
            "Automação avançada",
            "API completa",
            "SSO e segurança avançada",
            "Onboarding dedicado"
        ]'::jsonb,
        '{
            "max_contacts": null,
            "max_users": null,
            "max_pipelines": null,
            "max_schedules": null,
            "storage_gb": 500
        }'::jsonb,
        'active',
        3,
        NOW(),
        NOW()
    )
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "price_cents" = EXCLUDED."price_cents",
    "features" = EXCLUDED."features",
    "limits" = EXCLUDED."limits",
    "updated_at" = NOW();

-- ============================================
-- SEED: Cupons de desconto
-- ============================================
INSERT INTO "coupons" ("id", "code", "description", "discount_percent", "valid_from", "valid_until", "max_uses", "uses_count", "max_uses_per_customer", "min_purchase_cents", "applies_to", "status", "created_at", "updated_at")
VALUES 
    (
        '00000000-0000-0000-0000-000000000020',
        'BEMVINDO20',
        '20% de desconto para novos clientes no primeiro mês',
        20,
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
        '00000000-0000-0000-0000-000000000021',
        'PRO50OFF',
        'R$ 50,00 de desconto na assinatura Pro',
        NULL,
        NOW(),
        NOW() + INTERVAL '6 months',
        50,
        0,
        1,
        19700,
        '["00000000-0000-0000-0000-000000000011"]'::jsonb,
        'active',
        NOW(),
        NOW()
    )
ON CONFLICT ("id") DO UPDATE SET
    "code" = EXCLUDED."code",
    "description" = EXCLUDED."description",
    "discount_percent" = EXCLUDED."discount_percent",
    "valid_until" = EXCLUDED."valid_until",
    "updated_at" = NOW();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Tabela plans criada com sucesso' as status;
SELECT 'Tabela subscriptions criada com sucesso' as status;
SELECT 'Tabela invoices criada com sucesso' as status;
SELECT 'Tabela charges criada com sucesso' as status;
SELECT 'Tabela coupons criada com sucesso' as status;
SELECT 'Tabela subscription_coupons criada com sucesso' as status;

-- Contagem de registros
SELECT COUNT(*) as total_plans FROM "plans";
SELECT COUNT(*) as total_coupons FROM "coupons";
