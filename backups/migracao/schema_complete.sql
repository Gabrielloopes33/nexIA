-- ============================================================
-- NEXIA - SCHEMA COMPLETO PARA SUPABASE
-- ============================================================
-- Execute no SQL Editor do Supabase: https://app.supabase.com/project/_/sql
-- 
-- Este script cria:
-- - Todos os enums como tipos PostgreSQL
-- - Todas as tabelas do schema Prisma
-- - Índices para performance
-- - Chaves estrangeiras
-- - Políticas RLS (Row Level Security)
-- - Triggers para updated_at
--
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. ENUMS (Tipos Personalizados)
-- ============================================================

-- Multi-tenancy
CREATE TYPE organization_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE organization_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE member_status AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- WhatsApp
CREATE TYPE whatsapp_instance_status AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'SUSPENDED', 'PENDING_SETUP');
CREATE TYPE quality_rating AS ENUM ('GREEN', 'YELLOW', 'RED', 'UNKNOWN');
CREATE TYPE template_category AS ENUM ('AUTHENTICATION', 'MARKETING', 'UTILITY');
CREATE TYPE template_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');
CREATE TYPE conversation_type AS ENUM ('USER_INITIATED', 'BUSINESS_INITIATED', 'REFERRAL_INITIATED');
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'EXPIRED', 'CLOSED');
CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'TEMPLATE', 'INTERACTIVE');
CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE contact_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- Instagram
CREATE TYPE instagram_instance_status AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR', 'SUSPENDED');

-- Pipeline
CREATE TYPE deal_status AS ENUM ('OPEN', 'WON', 'LOST', 'PAUSED');
CREATE TYPE deal_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE activity_type AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'INSTAGRAM', 'STAGE_CHANGE', 'TASK_CREATED', 'TASK_COMPLETED', 'DOCUMENT', 'AUTOMATION', 'SYSTEM');

-- Form Delivery
CREATE TYPE pending_form_delivery_status AS ENUM ('WAITING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- ============================================================
-- 3. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABELAS
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

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_slug ON organizations(slug);

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_status ON organization_members(status);

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

CREATE INDEX idx_org_units_organization_id ON organization_units(organization_id);

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

CREATE INDEX idx_whatsapp_instances_organization_id ON whatsapp_cloud_instances(organization_id);
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_cloud_instances(status);
CREATE INDEX idx_whatsapp_instances_phone_number ON whatsapp_cloud_instances(phone_number);
CREATE INDEX idx_whatsapp_instances_agent_id ON whatsapp_cloud_instances(agent_id);
CREATE INDEX idx_whatsapp_instances_unit_id ON whatsapp_cloud_instances(unit_id);
CREATE INDEX idx_whatsapp_instances_waba_id ON whatsapp_cloud_instances(waba_id);
CREATE INDEX idx_whatsapp_instances_phone_number_id ON whatsapp_cloud_instances(phone_number_id);

CREATE TRIGGER update_whatsapp_instances_updated_at
    BEFORE UPDATE ON whatsapp_cloud_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX idx_whatsapp_templates_instance_id ON whatsapp_cloud_templates(instance_id);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_cloud_templates(status);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_cloud_templates(category);
CREATE INDEX idx_whatsapp_templates_language ON whatsapp_cloud_templates(language);
CREATE INDEX idx_whatsapp_templates_name_instance ON whatsapp_cloud_templates(name, instance_id);

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

CREATE INDEX idx_whatsapp_logs_instance_id ON whatsapp_cloud_logs(instance_id);
CREATE INDEX idx_whatsapp_logs_type ON whatsapp_cloud_logs(type);
CREATE INDEX idx_whatsapp_logs_event_type ON whatsapp_cloud_logs(event_type);
CREATE INDEX idx_whatsapp_logs_processed ON whatsapp_cloud_logs(processed);
CREATE INDEX idx_whatsapp_logs_created_at ON whatsapp_cloud_logs(created_at);

CREATE TRIGGER update_whatsapp_logs_updated_at
    BEFORE UPDATE ON whatsapp_cloud_logs
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, phone)
);

CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_lead_score ON contacts(lead_score);

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
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

CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_instance_id ON conversations(instance_id);
CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_window_end ON conversations(window_end);
CREATE INDEX idx_conversations_org_contact ON conversations(organization_id, contact_id);

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_message_id ON messages(message_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

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

CREATE INDEX idx_instagram_instances_organization_id ON instagram_instances(organization_id);
CREATE INDEX idx_instagram_instances_status ON instagram_instances(status);
CREATE INDEX idx_instagram_instances_account_id ON instagram_instances(instagram_business_account_id);

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

CREATE INDEX idx_pipeline_stages_organization_id ON pipeline_stages(organization_id);
CREATE INDEX idx_pipeline_stages_position ON pipeline_stages(position);

CREATE TRIGGER update_pipeline_stages_updated_at
    BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: pipeline_templates
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

CREATE INDEX idx_pipeline_templates_category ON pipeline_templates(category);
CREATE INDEX idx_pipeline_templates_is_default ON pipeline_templates(is_default);

CREATE TRIGGER update_pipeline_templates_updated_at
    BEFORE UPDATE ON pipeline_templates
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

CREATE INDEX idx_pipeline_template_stages_template_id ON pipeline_template_stages(template_id);
CREATE INDEX idx_pipeline_template_stages_position ON pipeline_template_stages(position);

CREATE TRIGGER update_pipeline_template_stages_updated_at
    BEFORE UPDATE ON pipeline_template_stages
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

CREATE INDEX idx_deals_organization_id ON deals(organization_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_priority ON deals(priority);
CREATE INDEX idx_deals_lead_score ON deals(lead_score);
CREATE INDEX idx_deals_source ON deals(source);
CREATE INDEX idx_deals_tags ON deals USING GIN(tags);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON deal_activities(type);
CREATE INDEX idx_deal_activities_performed_by ON deal_activities(performed_by);
CREATE INDEX idx_deal_activities_created_at ON deal_activities(created_at);

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

CREATE INDEX idx_meta_webhook_logs_organization_id ON meta_webhook_logs(organization_id);
CREATE INDEX idx_meta_webhook_logs_whatsapp_instance ON meta_webhook_logs(whatsapp_instance_id);
CREATE INDEX idx_meta_webhook_logs_instagram_instance ON meta_webhook_logs(instagram_instance_id);
CREATE INDEX idx_meta_webhook_logs_event_type ON meta_webhook_logs(event_type);
CREATE INDEX idx_meta_webhook_logs_created_at ON meta_webhook_logs(created_at);
CREATE INDEX idx_meta_webhook_logs_processed ON meta_webhook_logs(processed);

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

CREATE INDEX idx_pending_form_deliveries_message_id ON pending_form_deliveries(message_id);
CREATE INDEX idx_pending_form_deliveries_organization ON pending_form_deliveries(organization_id);
CREATE INDEX idx_pending_form_deliveries_status ON pending_form_deliveries(status);
CREATE INDEX idx_pending_form_deliveries_expires_at ON pending_form_deliveries(expires_at);
CREATE INDEX idx_pending_form_deliveries_dossie ON pending_form_deliveries(dossie_id);
CREATE INDEX idx_pending_form_deliveries_created_at ON pending_form_deliveries(created_at);

CREATE TRIGGER update_pending_form_deliveries_updated_at
    BEFORE UPDATE ON pending_form_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
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
-- 6. DADOS INICIAIS (OPCIONAL)
-- ============================================================

-- Template de pipeline padrão para CRM
INSERT INTO pipeline_templates (id, name, category, description, is_default)
VALUES (
    gen_random_uuid(),
    'Funil de Vendas Padrão',
    'SALES',
    'Funil padrão para gestão de vendas e oportunidades',
    true
)
ON CONFLICT (category) DO NOTHING;

-- ============================================================
-- 7. FUNÇÕES ADICIONAIS ÚTEIS
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

CREATE TRIGGER trigger_increment_conversation_count
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_conversation_message_count();

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o SQL Editor do Supabase
-- 2. Cole este script completo
-- 3. Execute (Run)
-- 4. Verifique se todas as tabelas foram criadas em Table Editor
--
-- APÓS EXECUTAR:
-- - Configure as políticas RLS adicionais conforme necessário
-- - Crie buckets no Storage para uploads de mídia
-- - Configure os webhooks para WhatsApp/Instagram
--
-- ============================================================
