-- ============================================================
-- NEXIA - SCHEMA COMPLETO PARA SUPABASE SELF-HOSTED
-- ============================================================
-- 
-- INSTRUÇÕES DE EXECUÇÃO:
-- 
-- 1. Via psql (recomendado):
--    export PGPASSWORD='your-super-secret-and-long-postgres-password'
--    psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -f migrations/selfhosted_create_schema.sql
--
-- 2. Via docker:
--    cat migrations/selfhosted_create_schema.sql | docker exec -i supabase-db psql -U postgres -d postgres
--
-- 3. Verificar conexão antes:
--    psql -h 49.13.228.89 -p 6543 -U postgres -d postgres -c "SELECT version();"
--
-- ============================================================

-- Configurar para ignorar erros de objetos já existentes
SET client_min_messages TO WARNING;

-- ============================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. ENUMS (Tipos Personalizados)
-- ============================================================

-- Multi-tenancy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_status') THEN
        CREATE TYPE organization_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
        CREATE TYPE organization_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
    END IF;
END $$;

-- WhatsApp
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_instance_status') THEN
        CREATE TYPE whatsapp_instance_status AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'SUSPENDED', 'PENDING_SETUP');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quality_rating') THEN
        CREATE TYPE quality_rating AS ENUM ('GREEN', 'YELLOW', 'RED', 'UNKNOWN');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_category') THEN
        CREATE TYPE template_category AS ENUM ('AUTHENTICATION', 'MARKETING', 'UTILITY');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_status') THEN
        CREATE TYPE template_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
        CREATE TYPE conversation_type AS ENUM ('USER_INITIATED', 'BUSINESS_INITIATED', 'REFERRAL_INITIATED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
        CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'EXPIRED', 'CLOSED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_direction') THEN
        CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'TEMPLATE', 'INTERACTIVE');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
        CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
        CREATE TYPE contact_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
    END IF;
END $$;

-- Instagram
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instagram_instance_status') THEN
        CREATE TYPE instagram_instance_status AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'SUSPENDED');
    END IF;
END $$;

-- Pipeline
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status') THEN
        CREATE TYPE deal_status AS ENUM ('OPEN', 'WON', 'LOST', 'PAUSED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_priority') THEN
        CREATE TYPE deal_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'INSTAGRAM', 'STAGE_CHANGE', 'TASK_CREATED', 'TASK_COMPLETED', 'DOCUMENT', 'AUTOMATION', 'SYSTEM');
    END IF;
END $$;

-- Form Delivery
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pending_form_delivery_status') THEN
        CREATE TYPE pending_form_delivery_status AS ENUM ('WAITING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');
    END IF;
END $$;

-- ============================================================
-- 3. FUNÇÕES UTILITÁRIAS
-- ============================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABELAS BASE (Nível 1 - Sem dependências de FK)
-- ============================================================

-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: pipeline_templates (independente)
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_templates_category ON pipeline_templates(category);
CREATE INDEX IF NOT EXISTS idx_pipeline_templates_is_default ON pipeline_templates(is_default);

DROP TRIGGER IF EXISTS update_pipeline_templates_updated_at ON pipeline_templates;
CREATE TRIGGER update_pipeline_templates_updated_at
    BEFORE UPDATE ON pipeline_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: plans (independente)
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    interval VARCHAR(20) NOT NULL CHECK (interval IN ('monthly', 'yearly')),
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_interval ON plans(interval);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: coupons (independente)
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_cents INTEGER CHECK (discount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    uses_count INTEGER NOT NULL DEFAULT 0,
    max_uses_per_customer INTEGER NOT NULL DEFAULT 1,
    min_purchase_cents INTEGER DEFAULT 0,
    applies_to JSONB DEFAULT '["all_plans"]',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    stripe_coupon_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. TABELAS NÍVEL 2 (Dependem de users)
-- ============================================================

-- ============================================
-- TABELA: organizations
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    logo_url TEXT,
    feature_flags JSONB,
    settings JSONB,
    status organization_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. TABELAS NÍVEL 3 (Dependem de organizations)
-- ============================================================

-- ============================================
-- TABELA: organization_members
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role organization_role DEFAULT 'MEMBER',
    status member_status DEFAULT 'ACTIVE',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

DROP TRIGGER IF EXISTS update_org_members_updated_at ON organization_members;
CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: organization_units
-- ============================================
CREATE TABLE IF NOT EXISTS organization_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_org_units_organization_id ON organization_units(organization_id);

DROP TRIGGER IF EXISTS update_org_units_updated_at ON organization_units;
CREATE TRIGGER update_org_units_updated_at
    BEFORE UPDATE ON organization_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: whatsapp_cloud_instances
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_cloud_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    unit_id UUID,
    waba_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    business_id VARCHAR(255),
    display_phone_number VARCHAR(50),
    verified_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    status VARCHAR(50) DEFAULT 'DISCONNECTED',
    webhook_verified BOOLEAN DEFAULT FALSE,
    quality_rating VARCHAR(20),
    messaging_limit VARCHAR(50),
    channel_type VARCHAR(50),
    scopes TEXT[],
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    custom_fields JSONB,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    messaging_tier INTEGER DEFAULT 1,
    webhook_verify_token VARCHAR(255),
    settings JSONB,
    connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_cloud_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_cloud_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone_number ON whatsapp_cloud_instances(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_agent_id ON whatsapp_cloud_instances(agent_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_unit_id ON whatsapp_cloud_instances(unit_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_waba_id ON whatsapp_cloud_instances(waba_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone_number_id ON whatsapp_cloud_instances(phone_number_id);

DROP TRIGGER IF EXISTS update_whatsapp_instances_updated_at ON whatsapp_cloud_instances;
CREATE TRIGGER update_whatsapp_instances_updated_at
    BEFORE UPDATE ON whatsapp_cloud_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: contacts
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    metadata JSONB,
    tags TEXT[],
    lead_score INTEGER DEFAULT 0,
    status contact_status DEFAULT 'ACTIVE',
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts(lead_score);
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: instagram_instances
-- ============================================
CREATE TABLE IF NOT EXISTS instagram_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    page_id VARCHAR(255) NOT NULL,
    instagram_business_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    username VARCHAR(255),
    profile_picture_url TEXT,
    status instagram_instance_status DEFAULT 'DISCONNECTED',
    webhook_verify_token VARCHAR(255),
    settings JSONB,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connected_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_instagram_instances_organization_id ON instagram_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_instagram_instances_status ON instagram_instances(status);
CREATE INDEX IF NOT EXISTS idx_instagram_instances_account_id ON instagram_instances(instagram_business_account_id);

DROP TRIGGER IF EXISTS update_instagram_instances_updated_at ON instagram_instances;
CREATE TRIGGER update_instagram_instances_updated_at
    BEFORE UPDATE ON instagram_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: pipeline_stages
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7),
    probability INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_organization_id ON pipeline_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(position);

DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER update_pipeline_stages_updated_at
    BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: tags
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    description TEXT,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: lists
-- ============================================
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}',
    is_dynamic BOOLEAN NOT NULL DEFAULT false,
    contact_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_organization_id ON lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON lists(created_by);

DROP TRIGGER IF EXISTS update_lists_updated_at ON lists;
CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: integrations
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    config JSONB,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: custom_field_definitions
-- ============================================
CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB NOT NULL DEFAULT '[]',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_organization_id ON custom_field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_is_active ON custom_field_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_display_order ON custom_field_definitions(display_order);

DROP TRIGGER IF EXISTS update_custom_field_definitions_updated_at ON custom_field_definitions;
CREATE TRIGGER update_custom_field_definitions_updated_at
    BEFORE UPDATE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: segments
-- ============================================
CREATE TABLE IF NOT EXISTS segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]',
    contact_count INTEGER NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_organization_id ON segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by);

DROP TRIGGER IF EXISTS update_segments_updated_at ON segments;
CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. TABELAS NÍVEL 4 (Dependem de tabelas Nível 3)
-- ============================================================

-- ============================================
-- TABELA: whatsapp_cloud_templates
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_cloud_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_cloud_instances(id) ON DELETE CASCADE,
    template_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL,
    components JSONB NOT NULL,
    body TEXT NOT NULL,
    header TEXT,
    footer TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT',
    reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_instance_id ON whatsapp_cloud_templates(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_cloud_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_cloud_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON whatsapp_cloud_templates(language);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name_instance ON whatsapp_cloud_templates(name, instance_id);

DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_cloud_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_cloud_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: whatsapp_cloud_logs
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_cloud_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_cloud_instances(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    level VARCHAR(20),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    type VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_instance_id ON whatsapp_cloud_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_type ON whatsapp_cloud_logs(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_event_type ON whatsapp_cloud_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_processed ON whatsapp_cloud_logs(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_cloud_logs(created_at);

DROP TRIGGER IF EXISTS update_whatsapp_logs_updated_at ON whatsapp_cloud_logs;
CREATE TRIGGER update_whatsapp_logs_updated_at
    BEFORE UPDATE ON whatsapp_cloud_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: conversations
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES whatsapp_cloud_instances(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    conversation_id VARCHAR(255) UNIQUE,
    type conversation_type NOT NULL,
    status conversation_status DEFAULT 'ACTIVE',
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_instance_id ON conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_window_end ON conversations(window_end);
CREATE INDEX IF NOT EXISTS idx_conversations_org_contact ON conversations(organization_id, contact_id);

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: deals
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    unit_id UUID REFERENCES organization_units(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'BRL',
    lead_score INTEGER DEFAULT 0,
    probability INTEGER,
    expected_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100),
    source_id VARCHAR(255),
    assigned_to UUID REFERENCES users(id),
    status deal_status DEFAULT 'OPEN',
    priority deal_priority DEFAULT 'MEDIUM',
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_priority ON deals(priority);
CREATE INDEX IF NOT EXISTS idx_deals_lead_score ON deals(lead_score);
CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(source);
CREATE INDEX IF NOT EXISTS idx_deals_tags ON deals USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close ON deals(expected_close_date);

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: pipeline_template_stages
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_template_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES pipeline_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7),
    probability INTEGER DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_template_stages_template_id ON pipeline_template_stages(template_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_template_stages_position ON pipeline_template_stages(position);

DROP TRIGGER IF EXISTS update_pipeline_template_stages_updated_at ON pipeline_template_stages;
CREATE TRIGGER update_pipeline_template_stages_updated_at
    BEFORE UPDATE ON pipeline_template_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: contact_tags
-- ============================================
CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_assigned_by ON contact_tags(assigned_by);

-- ============================================
-- TABELA: list_contacts
-- ============================================
CREATE TABLE IF NOT EXISTS list_contacts (
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (list_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_list_contacts_list_id ON list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_contact_id ON list_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_added_by ON list_contacts(added_by);

-- ============================================
-- TABELA: integration_configs
-- ============================================
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(integration_id, key)
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_integration_id ON integration_configs(integration_id);

-- ============================================
-- TABELA: invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded', 'uncollectible')),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    pdf_url TEXT,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: charges
-- ============================================
CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'refunded', 'disputed')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'boleto', 'pix', 'bank_transfer', 'wallet')),
    paid_at TIMESTAMP WITH TIME ZONE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    failure_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charges_organization_id ON charges(organization_id);
CREATE INDEX IF NOT EXISTS idx_charges_invoice_id ON charges(invoice_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_payment_method ON charges(payment_method);
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON charges(created_at);
CREATE INDEX IF NOT EXISTS idx_charges_stripe_payment_intent_id ON charges(stripe_payment_intent_id);

DROP TRIGGER IF EXISTS update_charges_updated_at ON charges;
CREATE TRIGGER update_charges_updated_at
    BEFORE UPDATE ON charges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: subscription_coupons
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    discount_applied_cents INTEGER NOT NULL DEFAULT 0,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(subscription_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_coupons_subscription_id ON subscription_coupons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_coupons_coupon_id ON subscription_coupons(coupon_id);

-- ============================================
-- TABELA: contact_custom_field_values
-- ============================================
CREATE TABLE IF NOT EXISTS contact_custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(contact_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_custom_field_values_contact_id ON contact_custom_field_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_custom_field_values_field_id ON contact_custom_field_values(field_id);

DROP TRIGGER IF EXISTS update_contact_custom_field_values_updated_at ON contact_custom_field_values;
CREATE TRIGGER update_contact_custom_field_values_updated_at
    BEFORE UPDATE ON contact_custom_field_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. TABELAS NÍVEL 5 (Dependem de tabelas Nível 4)
-- ============================================================

-- ============================================
-- TABELA: messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    message_id VARCHAR(255) UNIQUE,
    direction message_direction NOT NULL,
    type message_type NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    caption TEXT,
    template_id UUID REFERENCES whatsapp_cloud_templates(id),
    status message_status DEFAULT 'SENT',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- ============================================
-- TABELA: deal_activities
-- ============================================
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSONB,
    score_impact INTEGER DEFAULT 0,
    performed_by UUID REFERENCES users(id),
    automation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type ON deal_activities(type);
CREATE INDEX IF NOT EXISTS idx_deal_activities_performed_by ON deal_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_deal_activities_created_at ON deal_activities(created_at);

-- ============================================
-- TABELA: meta_webhook_logs
-- ============================================
CREATE TABLE IF NOT EXISTS meta_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    whatsapp_instance_id UUID REFERENCES whatsapp_cloud_instances(id) ON DELETE SET NULL,
    instagram_instance_id UUID REFERENCES instagram_instances(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    forwarded_to_n8n BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_organization_id ON meta_webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_whatsapp_instance ON meta_webhook_logs(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_instagram_instance ON meta_webhook_logs(instagram_instance_id);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_event_type ON meta_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_created_at ON meta_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_meta_webhook_logs_processed ON meta_webhook_logs(processed);

-- ============================================
-- TABELA: pending_form_deliveries
-- ============================================
CREATE TABLE IF NOT EXISTS pending_form_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id VARCHAR(255) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    instance_id UUID NOT NULL REFERENCES whatsapp_cloud_instances(id),
    phone VARCHAR(50) NOT NULL,
    pdf_url TEXT NOT NULL,
    pdf_filename VARCHAR(255) NOT NULL,
    media_id VARCHAR(255),
    template_name VARCHAR(255) NOT NULL,
    template_language VARCHAR(10) DEFAULT 'pt_BR',
    lead_name VARCHAR(255),
    lead_email VARCHAR(255),
    dossie_id VARCHAR(255),
    aluno_id VARCHAR(255),
    status pending_form_delivery_status DEFAULT 'WAITING',
    retry_count INTEGER DEFAULT 0,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by VARCHAR(255),
    reprocessed_from UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_message_id ON pending_form_deliveries(message_id);
CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_organization ON pending_form_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_status ON pending_form_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_expires_at ON pending_form_deliveries(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_dossie ON pending_form_deliveries(dossie_id);
CREATE INDEX IF NOT EXISTS idx_pending_form_deliveries_created_at ON pending_form_deliveries(created_at);

DROP TRIGGER IF EXISTS update_pending_form_deliveries_updated_at ON pending_form_deliveries;
CREATE TRIGGER update_pending_form_deliveries_updated_at
    BEFORE UPDATE ON pending_form_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. FUNÇÕES E TRIGGERS ADICIONAIS
-- ============================================================

-- Função para buscar conversas ativas por contato
CREATE OR REPLACE FUNCTION get_active_conversation(p_contact_id UUID)
RETURNS TABLE (
    id UUID,
    conversation_id VARCHAR,
    status conversation_status,
    window_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.conversation_id, c.status, c.window_end
    FROM conversations c
    WHERE c.contact_id = p_contact_id
    AND c.status = 'ACTIVE'
    AND c.window_end > NOW()
    ORDER BY c.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar last_interaction_at do contato
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts
    SET last_interaction_at = NEW.created_at
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_last_interaction ON messages;
CREATE TRIGGER trigger_update_contact_last_interaction
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_last_interaction();

-- Função para incrementar message_count na conversa
CREATE OR REPLACE FUNCTION increment_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_conversation_count ON messages;
CREATE TRIGGER trigger_increment_conversation_count
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_conversation_message_count();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_cloud_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_form_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Organization members can view" ON organizations;
DROP POLICY IF EXISTS "Organization owners and admins can update" ON organizations;
DROP POLICY IF EXISTS "Members can view org memberships" ON organization_members;
DROP POLICY IF EXISTS "Contacts organization based access" ON contacts;
DROP POLICY IF EXISTS "Conversations organization based access" ON conversations;
DROP POLICY IF EXISTS "Messages organization based access" ON messages;
DROP POLICY IF EXISTS "Deals organization based access" ON deals;
DROP POLICY IF EXISTS "Pipeline stages organization based access" ON pipeline_stages;
DROP POLICY IF EXISTS "WhatsApp instances organization based access" ON whatsapp_cloud_instances;
DROP POLICY IF EXISTS "Instagram instances organization based access" ON instagram_instances;
DROP POLICY IF EXISTS "Webhook logs organization based access" ON meta_webhook_logs;
DROP POLICY IF EXISTS "Tags organization based access" ON tags;
DROP POLICY IF EXISTS "Lists organization based access" ON lists;
DROP POLICY IF EXISTS "Integrations organization based access" ON integrations;

-- Políticas para users (usuários podem ver apenas seu próprio perfil)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para organizations (baseado em membership)
CREATE POLICY "Organization members can view" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
            AND status = 'ACTIVE'
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Organization owners and admins can update" ON organizations
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
            AND role IN ('ADMIN', 'OWNER')
            AND status = 'ACTIVE'
        )
    );

-- Políticas para organization_members
CREATE POLICY "Members can view org memberships" ON organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para contacts
CREATE POLICY "Contacts organization based access" ON contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = contacts.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para conversations
CREATE POLICY "Conversations organization based access" ON conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN contacts c ON c.organization_id = om.organization_id
            WHERE c.id = conversations.contact_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para messages
CREATE POLICY "Messages organization based access" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN contacts c ON c.organization_id = om.organization_id
            JOIN conversations conv ON conv.contact_id = c.id
            WHERE conv.id = messages.conversation_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para deals
CREATE POLICY "Deals organization based access" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = deals.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
        OR assigned_to = auth.uid()
    );

-- Políticas para pipeline_stages
CREATE POLICY "Pipeline stages organization based access" ON pipeline_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = pipeline_stages.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para tags
CREATE POLICY "Tags organization based access" ON tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = tags.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para lists
CREATE POLICY "Lists organization based access" ON lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = lists.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para whatsapp_cloud_instances
CREATE POLICY "WhatsApp instances organization based access" ON whatsapp_cloud_instances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = whatsapp_cloud_instances.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para instagram_instances
CREATE POLICY "Instagram instances organization based access" ON instagram_instances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = instagram_instances.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para integrations
CREATE POLICY "Integrations organization based access" ON integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = integrations.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- Políticas para meta_webhook_logs
CREATE POLICY "Webhook logs organization based access" ON meta_webhook_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = meta_webhook_logs.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'ACTIVE'
        )
    );

-- ============================================================
-- 11. VIEWS
-- ============================================================

-- View do dashboard
DROP VIEW IF EXISTS v_dashboard_summary;

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- Contatos
    COALESCE((
        SELECT COUNT(*) FROM contacts c 
        WHERE c.organization_id = o.id 
        AND c.deleted_at IS NULL
    ), 0) as total_contacts,
    
    -- Contatos novos este mês
    COALESCE((
        SELECT COUNT(*) FROM contacts c 
        WHERE c.organization_id = o.id 
        AND c.deleted_at IS NULL
        AND c.created_at >= DATE_TRUNC('month', NOW())
    ), 0) as new_contacts_this_month,
    
    -- Conversas
    COALESCE((
        SELECT COUNT(*) FROM conversations c 
        WHERE c.organization_id = o.id
    ), 0) as total_conversations,
    
    -- Conversas ativas
    COALESCE((
        SELECT COUNT(*) FROM conversations c 
        WHERE c.organization_id = o.id AND c.status = 'ACTIVE'
    ), 0) as active_conversations,
    
    -- Total de deals
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        WHERE d.organization_id = o.id
    ), 0) as total_deals,
    
    -- Deals ganhos
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        WHERE d.organization_id = o.id 
        AND d.status = 'WON'
    ), 0) as won_deals,
    
    -- Deals perdidos
    COALESCE((
        SELECT COUNT(*) FROM deals d 
        WHERE d.organization_id = o.id 
        AND d.status = 'LOST'
    ), 0) as lost_deals,
    
    -- Valor do pipeline (deals abertos)
    COALESCE((
        SELECT SUM(d.amount) FROM deals d 
        WHERE d.organization_id = o.id 
        AND d.status = 'OPEN'
    ), 0) as pipeline_value,
    
    -- Receita mensal
    COALESCE((
        SELECT SUM(c.amount_cents) / 100.0 
        FROM charges c 
        WHERE c.organization_id = o.id 
        AND c.status = 'paid'
        AND c.paid_at >= DATE_TRUNC('month', NOW())
    ), 0) as monthly_revenue,
    
    -- Assinaturas ativas
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'active'
    ), 0) as active_subscriptions,
    
    -- Assinaturas em trial
    COALESCE((
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.organization_id = o.id 
        AND s.status = 'trialing'
    ), 0) as trial_subscriptions,
    
    NOW() as calculated_at
FROM organizations o;

-- ============================================================
-- 12. DADOS INICIAIS (SEED)
-- ============================================================

-- Planos de assinatura
INSERT INTO plans (id, name, description, price_cents, interval, features, limits, status, sort_order, created_at, updated_at)
VALUES 
    (
        '00000000-0000-0000-0000-000000000010',
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
        '00000000-0000-0000-0000-000000000011',
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
        '00000000-0000-0000-0000-000000000012',
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
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    updated_at = NOW();

-- Cupons de desconto
INSERT INTO coupons (id, code, description, discount_percent, valid_from, valid_until, max_uses, uses_count, max_uses_per_customer, min_purchase_cents, applies_to, status, created_at, updated_at)
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
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    discount_percent = EXCLUDED.discount_percent,
    valid_until = EXCLUDED.valid_until,
    updated_at = NOW();

-- Template de pipeline padrão para CRM
INSERT INTO pipeline_templates (id, name, category, description, is_default)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Funil de Vendas Padrão',
    'SALES',
    'Funil padrão para gestão de vendas e oportunidades',
    true
)
ON CONFLICT (category) DO NOTHING;

-- ============================================================
-- 13. VERIFICAÇÃO FINAL
-- ============================================================

-- Contagem de tabelas criadas
SELECT 
    'Schema criado com sucesso!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as total_views,
    (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as total_enums;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- 
-- APÓS EXECUTAR:
-- 1. Verifique se todas as tabelas foram criadas:
--    \dt (no psql)
-- 
-- 2. Configure o auth do Supabase:
--    - Crie as policies adicionais conforme necessário
--    - Configure os triggers de auth.users se necessário
--
-- 3. Crie buckets no Storage para uploads de mídia
--
-- 4. Configure os webhooks para WhatsApp/Instagram
--
-- ============================================================
