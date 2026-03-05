-- Migration: WhatsApp Business API Integration
-- Cria todas as tabelas necessárias para integração com WhatsApp Business API

-- ============================================
-- ENUMS
-- ============================================

-- Enum: WhatsAppStatus
CREATE TYPE "WhatsAppStatus" AS ENUM (
    'NOT_CONNECTED',
    'CONNECTING',
    'CONNECTED',
    'ERROR',
    'SUSPENDED'
);

-- Enum: PhoneStatus
CREATE TYPE "PhoneStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'BLOCKED',
    'DELETED'
);

-- Enum: QualityRating
CREATE TYPE "QualityRating" AS ENUM (
    'GREEN',
    'YELLOW',
    'RED',
    'UNKNOWN'
);

-- Enum: TemplateCategory
CREATE TYPE "TemplateCategory" AS ENUM (
    'AUTHENTICATION',
    'MARKETING',
    'UTILITY'
);

-- Enum: TemplateStatus
CREATE TYPE "TemplateStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAUSED',
    'DISABLED'
);

-- Enum: ConversationType
CREATE TYPE "ConversationType" AS ENUM (
    'USER_INITIATED',
    'BUSINESS_INITIATED',
    'REFERRAL_INITIATED'
);

-- Enum: ConversationStatus
CREATE TYPE "ConversationStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CLOSED'
);

-- Enum: MessageDirection
CREATE TYPE "MessageDirection" AS ENUM (
    'INBOUND',
    'OUTBOUND'
);

-- Enum: MessageType
CREATE TYPE "MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'VIDEO',
    'AUDIO',
    'DOCUMENT',
    'LOCATION',
    'CONTACT',
    'TEMPLATE',
    'INTERACTIVE'
);

-- Enum: MessageStatus
CREATE TYPE "MessageStatus" AS ENUM (
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED'
);

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela: users (modelo de referência)
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Tabela: whatsapp_business_accounts
CREATE TABLE "whatsapp_business_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "waba_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255),
    "timezone_id" VARCHAR(255),
    "message_template_namespace" VARCHAR(255),
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "quality_rating" "QualityRating",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "connected_at" TIMESTAMP(3),
    "user_id" UUID NOT NULL,

    CONSTRAINT "whatsapp_business_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_business_accounts_waba_id_key" ON "whatsapp_business_accounts"("waba_id");
CREATE INDEX "whatsapp_business_accounts_user_id_idx" ON "whatsapp_business_accounts"("user_id");
CREATE INDEX "whatsapp_business_accounts_status_idx" ON "whatsapp_business_accounts"("status");
CREATE INDEX "whatsapp_business_accounts_waba_id_idx" ON "whatsapp_business_accounts"("waba_id");

-- Tabela: whatsapp_phone_numbers
CREATE TABLE "whatsapp_phone_numbers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number_id" VARCHAR(255) NOT NULL,
    "display_phone_number" VARCHAR(255) NOT NULL,
    "verified_name" VARCHAR(255),
    "status" "PhoneStatus" NOT NULL DEFAULT 'PENDING',
    "quality_rating" "QualityRating" NOT NULL DEFAULT 'UNKNOWN',
    "messaging_tier" INTEGER NOT NULL DEFAULT 1,
    "messaging_limit" INTEGER NOT NULL DEFAULT 250,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "waba_id" UUID NOT NULL,
    "verification_code" VARCHAR(255),
    "code_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_phone_numbers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_phone_numbers_phone_number_id_key" ON "whatsapp_phone_numbers"("phone_number_id");
CREATE INDEX "whatsapp_phone_numbers_waba_id_idx" ON "whatsapp_phone_numbers"("waba_id");
CREATE INDEX "whatsapp_phone_numbers_status_idx" ON "whatsapp_phone_numbers"("status");
CREATE INDEX "whatsapp_phone_numbers_phone_number_id_idx" ON "whatsapp_phone_numbers"("phone_number_id");
CREATE INDEX "whatsapp_phone_numbers_display_phone_number_idx" ON "whatsapp_phone_numbers"("display_phone_number");

-- Tabela: message_templates
CREATE TABLE "message_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "components" JSONB NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "body" TEXT NOT NULL,
    "header" TEXT,
    "footer" TEXT,
    "waba_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_templates_template_id_key" ON "message_templates"("template_id");
CREATE INDEX "message_templates_waba_id_idx" ON "message_templates"("waba_id");
CREATE INDEX "message_templates_status_idx" ON "message_templates"("status");
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");
CREATE INDEX "message_templates_language_idx" ON "message_templates"("language");
CREATE INDEX "message_templates_name_waba_id_idx" ON "message_templates"("name", "waba_id");

-- Tabela: whatsapp_conversations
CREATE TABLE "whatsapp_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" VARCHAR(255),
    "contact_phone" VARCHAR(255) NOT NULL,
    "contact_name" VARCHAR(255),
    "type" "ConversationType" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "waba_id" UUID NOT NULL,
    "phone_number_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_conversations_conversation_id_key" ON "whatsapp_conversations"("conversation_id");
CREATE INDEX "whatsapp_conversations_waba_id_idx" ON "whatsapp_conversations"("waba_id");
CREATE INDEX "whatsapp_conversations_contact_phone_idx" ON "whatsapp_conversations"("contact_phone");
CREATE INDEX "whatsapp_conversations_status_idx" ON "whatsapp_conversations"("status");
CREATE INDEX "whatsapp_conversations_window_end_idx" ON "whatsapp_conversations"("window_end");
CREATE INDEX "whatsapp_conversations_waba_id_contact_phone_idx" ON "whatsapp_conversations"("waba_id", "contact_phone");
CREATE INDEX "whatsapp_conversations_phone_number_id_idx" ON "whatsapp_conversations"("phone_number_id");

-- Tabela: whatsapp_messages
CREATE TABLE "whatsapp_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" VARCHAR(255),
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "caption" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "template_id" UUID,
    "conversation_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_messages_message_id_key" ON "whatsapp_messages"("message_id");
CREATE INDEX "whatsapp_messages_conversation_id_idx" ON "whatsapp_messages"("conversation_id");
CREATE INDEX "whatsapp_messages_status_idx" ON "whatsapp_messages"("status");
CREATE INDEX "whatsapp_messages_direction_idx" ON "whatsapp_messages"("direction");
CREATE INDEX "whatsapp_messages_type_idx" ON "whatsapp_messages"("type");
CREATE INDEX "whatsapp_messages_created_at_idx" ON "whatsapp_messages"("created_at");
CREATE INDEX "whatsapp_messages_conversation_id_created_at_idx" ON "whatsapp_messages"("conversation_id", "created_at");

-- Tabela: webhook_events
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "object_type" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "waba_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "webhook_events_waba_id_idx" ON "webhook_events"("waba_id");
CREATE INDEX "webhook_events_event_type_idx" ON "webhook_events"("event_type");
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");
CREATE INDEX "webhook_events_created_at_idx" ON "webhook_events"("created_at");
CREATE INDEX "webhook_events_waba_id_event_type_idx" ON "webhook_events"("waba_id", "event_type");

-- Tabela: whatsapp_analytics
CREATE TABLE "whatsapp_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "conversations_total" INTEGER NOT NULL DEFAULT 0,
    "conversations_user_initiated" INTEGER NOT NULL DEFAULT 0,
    "conversations_business_initiated" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "messages_delivered" INTEGER NOT NULL DEFAULT 0,
    "messages_read" INTEGER NOT NULL DEFAULT 0,
    "messages_failed" INTEGER NOT NULL DEFAULT 0,
    "templates_sent" INTEGER NOT NULL DEFAULT 0,
    "quality_rating" "QualityRating" NOT NULL DEFAULT 'UNKNOWN',
    "waba_id" UUID NOT NULL,

    CONSTRAINT "whatsapp_analytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_analytics_waba_id_date_key" ON "whatsapp_analytics"("waba_id", "date");
CREATE INDEX "whatsapp_analytics_waba_id_date_idx" ON "whatsapp_analytics"("waba_id", "date");

-- ============================================
-- CHAVES ESTRANGEIRAS (FOREIGN KEYS)
-- ============================================

-- Foreign Keys: whatsapp_business_accounts
ALTER TABLE "whatsapp_business_accounts" 
    ADD CONSTRAINT "whatsapp_business_accounts_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: whatsapp_phone_numbers
ALTER TABLE "whatsapp_phone_numbers" 
    ADD CONSTRAINT "whatsapp_phone_numbers_waba_id_fkey" 
    FOREIGN KEY ("waba_id") REFERENCES "whatsapp_business_accounts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: message_templates
ALTER TABLE "message_templates" 
    ADD CONSTRAINT "message_templates_waba_id_fkey" 
    FOREIGN KEY ("waba_id") REFERENCES "whatsapp_business_accounts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: whatsapp_conversations
ALTER TABLE "whatsapp_conversations" 
    ADD CONSTRAINT "whatsapp_conversations_waba_id_fkey" 
    FOREIGN KEY ("waba_id") REFERENCES "whatsapp_business_accounts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_conversations" 
    ADD CONSTRAINT "whatsapp_conversations_phone_number_id_fkey" 
    FOREIGN KEY ("phone_number_id") REFERENCES "whatsapp_phone_numbers"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: whatsapp_messages
ALTER TABLE "whatsapp_messages" 
    ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages" 
    ADD CONSTRAINT "whatsapp_messages_template_id_fkey" 
    FOREIGN KEY ("template_id") REFERENCES "message_templates"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys: webhook_events
ALTER TABLE "webhook_events" 
    ADD CONSTRAINT "webhook_events_waba_id_fkey" 
    FOREIGN KEY ("waba_id") REFERENCES "whatsapp_business_accounts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: whatsapp_analytics
ALTER TABLE "whatsapp_analytics" 
    ADD CONSTRAINT "whatsapp_analytics_waba_id_fkey" 
    FOREIGN KEY ("waba_id") REFERENCES "whatsapp_business_accounts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_business_accounts_updated_at 
    BEFORE UPDATE ON "whatsapp_business_accounts" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_phone_numbers_updated_at 
    BEFORE UPDATE ON "whatsapp_phone_numbers" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at 
    BEFORE UPDATE ON "message_templates" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at 
    BEFORE UPDATE ON "whatsapp_conversations" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
