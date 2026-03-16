-- Migration: Base Schema
-- Tabelas base necessárias antes das migrations do Sprint 1
-- Tabelas: users, organizations, organization_members, organization_units, contacts

-- ============================================
-- FUNÇÃO: update_updated_at_column
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$
BEGIN
    -- OrganizationStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationStatus') THEN
        CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;

    -- OrganizationRole
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationRole') THEN
        CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
    END IF;

    -- MemberStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberStatus') THEN
        CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
    END IF;

    -- ContactStatus
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactStatus') THEN
        CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
    END IF;
END
$$;

-- ============================================
-- TABELA: users
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: organizations
-- ============================================

CREATE TABLE IF NOT EXISTS "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "owner_id" UUID NOT NULL,
    "logo_url" TEXT,
    "feature_flags" JSONB,
    "settings" JSONB,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organizations_slug_key" UNIQUE ("slug")
);

CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

ALTER TABLE "organizations"
    ADD CONSTRAINT "organizations_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON "organizations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: organization_members
-- ============================================

CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id")
);

CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX "organization_members_status_idx" ON "organization_members"("status");

ALTER TABLE "organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON "organization_members"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: organization_units
-- ============================================

CREATE TABLE IF NOT EXISTS "organization_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_units_organization_id_slug_key" ON "organization_units"("organization_id", "slug");
CREATE INDEX "organization_units_organization_id_idx" ON "organization_units"("organization_id");

ALTER TABLE "organization_units"
    ADD CONSTRAINT "organization_units_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_organization_units_updated_at
    BEFORE UPDATE ON "organization_units"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: contacts
-- ============================================

CREATE TABLE IF NOT EXISTS "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_interaction_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contacts_organization_id_phone_key" ON "contacts"("organization_id", "phone");
CREATE INDEX "contacts_organization_id_idx" ON "contacts"("organization_id");
CREATE INDEX "contacts_status_idx" ON "contacts"("status");
CREATE INDEX "contacts_tags_idx" ON "contacts" USING GIN("tags");
CREATE INDEX "contacts_lead_score_idx" ON "contacts"("lead_score");
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at") WHERE "deleted_at" IS NULL;

ALTER TABLE "contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON "contacts"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA MÍNIMO
-- ============================================

-- Criar usuário admin padrão
INSERT INTO "users" ("id", "email", "name", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@aurea.com', 'Admin', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Criar organização padrão
INSERT INTO "organizations" ("id", "name", "slug", "owner_id", "status", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000002', 'Aurea CRM', 'aurea-crm', '00000000-0000-0000-0000-000000000001', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Adicionar owner como membro
INSERT INTO "organization_members" ("id", "organization_id", "user_id", "role", "status", "joined_at")
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'OWNER', 'ACTIVE', NOW())
ON CONFLICT DO NOTHING;


-- Migration: Sprint 1 - Contacts Core
-- Tabelas: tags, contact_tags, lists, list_contacts, custom_field_definitions, contact_custom_field_values, segments

-- ============================================
-- ADD deleted_at TO contacts (Soft Delete)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE "contacts" ADD COLUMN "deleted_at" TIMESTAMP(3);
        CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at") WHERE "deleted_at" IS NULL;
    END IF;
END
$$;

-- ============================================
-- TABELA: tags
-- ============================================

CREATE TABLE IF NOT EXISTS "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_organization_id_name_key" ON "tags"("organization_id", "name");
CREATE INDEX "tags_organization_id_idx" ON "tags"("organization_id");
CREATE INDEX "tags_name_idx" ON "tags"("name");

ALTER TABLE "tags" 
    ADD CONSTRAINT "tags_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON "tags" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: contact_tags
-- ============================================

CREATE TABLE IF NOT EXISTS "contact_tags" (
    "contact_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("contact_id", "tag_id")
);

CREATE INDEX "contact_tags_contact_id_idx" ON "contact_tags"("contact_id");
CREATE INDEX "contact_tags_tag_id_idx" ON "contact_tags"("tag_id");
CREATE INDEX "contact_tags_assigned_by_idx" ON "contact_tags"("assigned_by");

ALTER TABLE "contact_tags" 
    ADD CONSTRAINT "contact_tags_contact_id_fkey" 
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_tags" 
    ADD CONSTRAINT "contact_tags_tag_id_fkey" 
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_tags" 
    ADD CONSTRAINT "contact_tags_assigned_by_fkey" 
    FOREIGN KEY ("assigned_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- TABELA: lists
-- ============================================

CREATE TABLE IF NOT EXISTS "lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_dynamic" BOOLEAN NOT NULL DEFAULT false,
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lists_organization_id_idx" ON "lists"("organization_id");
CREATE INDEX "lists_created_by_idx" ON "lists"("created_by");

ALTER TABLE "lists" 
    ADD CONSTRAINT "lists_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lists" 
    ADD CONSTRAINT "lists_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TRIGGER update_lists_updated_at 
    BEFORE UPDATE ON "lists" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: list_contacts
-- ============================================

CREATE TABLE IF NOT EXISTS "list_contacts" (
    "list_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID,

    CONSTRAINT "list_contacts_pkey" PRIMARY KEY ("list_id", "contact_id")
);

CREATE INDEX "list_contacts_list_id_idx" ON "list_contacts"("list_id");
CREATE INDEX "list_contacts_contact_id_idx" ON "list_contacts"("contact_id");
CREATE INDEX "list_contacts_added_by_idx" ON "list_contacts"("added_by");

ALTER TABLE "list_contacts" 
    ADD CONSTRAINT "list_contacts_list_id_fkey" 
    FOREIGN KEY ("list_id") REFERENCES "lists"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "list_contacts" 
    ADD CONSTRAINT "list_contacts_contact_id_fkey" 
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "list_contacts" 
    ADD CONSTRAINT "list_contacts_added_by_fkey" 
    FOREIGN KEY ("added_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- TABELA: custom_field_definitions
-- ============================================

CREATE TABLE IF NOT EXISTS "custom_field_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB NOT NULL DEFAULT '[]',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_field_definitions_organization_id_key_key" ON "custom_field_definitions"("organization_id", "key");
CREATE INDEX "custom_field_definitions_organization_id_idx" ON "custom_field_definitions"("organization_id");
CREATE INDEX "custom_field_definitions_is_active_idx" ON "custom_field_definitions"("is_active");
CREATE INDEX "custom_field_definitions_display_order_idx" ON "custom_field_definitions"("display_order");

ALTER TABLE "custom_field_definitions" 
    ADD CONSTRAINT "custom_field_definitions_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_custom_field_definitions_updated_at 
    BEFORE UPDATE ON "custom_field_definitions" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: contact_custom_field_values
-- ============================================

CREATE TABLE IF NOT EXISTS "contact_custom_field_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_custom_field_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contact_custom_field_values_contact_id_field_id_key" ON "contact_custom_field_values"("contact_id", "field_id");
CREATE INDEX "contact_custom_field_values_contact_id_idx" ON "contact_custom_field_values"("contact_id");
CREATE INDEX "contact_custom_field_values_field_id_idx" ON "contact_custom_field_values"("field_id");

ALTER TABLE "contact_custom_field_values" 
    ADD CONSTRAINT "contact_custom_field_values_contact_id_fkey" 
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contact_custom_field_values" 
    ADD CONSTRAINT "contact_custom_field_values_field_id_fkey" 
    FOREIGN KEY ("field_id") REFERENCES "custom_field_definitions"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER update_contact_custom_field_values_updated_at 
    BEFORE UPDATE ON "contact_custom_field_values" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: segments
-- ============================================

CREATE TABLE IF NOT EXISTS "segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL DEFAULT '[]',
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "segments_organization_id_idx" ON "segments"("organization_id");
CREATE INDEX "segments_created_by_idx" ON "segments"("created_by");

ALTER TABLE "segments" 
    ADD CONSTRAINT "segments_organization_id_fkey" 
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "segments" 
    ADD CONSTRAINT "segments_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TRIGGER update_segments_updated_at 
    BEFORE UPDATE ON "segments" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Seed tags
INSERT INTO "tags" ("organization_id", "name", "color", "source")
SELECT o."id", tag.name, tag.color, tag.source
FROM "organizations" o,
(VALUES
  ('Lead Quente', '#ef4444', 'manual'),
  ('Cliente VIP', '#f59e0b', 'manual'),
  ('Reengajamento', '#8b5cf6', 'automation'),
  ('Newsletter', '#06b6d4', 'utm'),
  ('Indicação', '#10b981', 'manual'),
  ('Trial Ativo', '#3b82f6', 'automation'),
  ('Churned', '#6b7280', 'automation')
) AS tag(name, color, source)
WHERE o."status" = 'ACTIVE'
ON CONFLICT ("organization_id", "name") DO NOTHING;

-- Seed custom field definitions
INSERT INTO "custom_field_definitions" ("organization_id", "name", "key", "type", "required", "display_order")
SELECT o."id", f.name, f.key, f.type, f.required::boolean, f.ord::int
FROM "organizations" o,
(VALUES
  ('CPF', 'cpf', 'text', 'false', 1),
  ('Data de Nascimento', 'birth_date', 'date', 'false', 2),
  ('Cargo', 'job_title', 'text', 'false', 3),
  ('Empresa', 'company', 'text', 'false', 4),
  ('Segmento', 'segment', 'select', 'false', 5),
  ('Origem do Lead', 'lead_source', 'select', 'false', 6)
) AS f(name, key, type, required, ord)
WHERE o."status" = 'ACTIVE'
ON CONFLICT ("organization_id", "key") DO NOTHING;

-- Seed lists
INSERT INTO "lists" ("organization_id", "name", "description")
SELECT o."id", l.name, l.description
FROM "organizations" o,
(VALUES
  ('Leads Ativos', 'Leads em processo de qualificação'),
  ('Clientes', 'Clientes com contrato ativo'),
  ('Newsletter', 'Inscritos na newsletter'),
  ('Inativos', 'Contatos sem interação nos últimos 90 dias')
) AS l(name, description)
WHERE o."status" = 'ACTIVE'
ON CONFLICT DO NOTHING;

-- Seed segments
INSERT INTO "segments" ("organization_id", "name", "description", "rules")
SELECT o."id", s.name, s.description, s.rules::jsonb
FROM "organizations" o,
(VALUES
  ('Leads Qualificados', 'Leads com score acima de 70', '[{"field":"score","operator":"gte","value":70}]'),
  ('Clientes em Risco', 'Sem compra nos últimos 60 dias', '[{"field":"last_purchase_days","operator":"gte","value":60}]')
) AS s(name, description, rules)
WHERE o."status" = 'ACTIVE'
ON CONFLICT DO NOTHING;
