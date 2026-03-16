-- ============================================
-- SUPABASE: Criar public.users + Tabelas Sprint 1
-- ============================================

-- 1. Criar Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationStatus') THEN
        CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationRole') THEN
        CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemberStatus') THEN
        CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactStatus') THEN
        CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
    END IF;
END
$$;

-- 2. Função update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar tabela public.users (se não existir) - para o Prisma
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE ("email")
);
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Adicionar colunas faltantes em organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE "organizations" ADD COLUMN "owner_id" UUID REFERENCES "users"(id);
    END IF;
END
$$;

-- 5. Adicionar colunas faltantes em contacts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'deleted_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "deleted_at" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'status') THEN
        ALTER TABLE "contacts" ADD COLUMN "status" "ContactStatus" DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lead_score') THEN
        ALTER TABLE "contacts" ADD COLUMN "lead_score" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tags') THEN
        ALTER TABLE "contacts" ADD COLUMN "tags" TEXT[];
    END IF;
END
$$;

-- 6. Criar índice para deleted_at
CREATE INDEX IF NOT EXISTS "contacts_deleted_at_idx" ON "contacts"("deleted_at") WHERE "deleted_at" IS NULL;

-- ============================================
-- TABELAS DO SPRINT 1
-- ============================================

-- Tabela: tags
CREATE TABLE IF NOT EXISTS "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE ("organization_id", "name")
);
CREATE INDEX IF NOT EXISTS "tags_organization_id_idx" ON "tags"("organization_id");
CREATE INDEX IF NOT EXISTS "tags_name_idx" ON "tags"("name");
DROP TRIGGER IF EXISTS update_tags_updated_at ON "tags";
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON "tags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: contact_tags
CREATE TABLE IF NOT EXISTS "contact_tags" (
    "contact_id" UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
    "tag_id" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("contact_id", "tag_id")
);
CREATE INDEX IF NOT EXISTS "contact_tags_contact_id_idx" ON "contact_tags"("contact_id");
CREATE INDEX IF NOT EXISTS "contact_tags_tag_id_idx" ON "contact_tags"("tag_id");

-- Tabela: lists
CREATE TABLE IF NOT EXISTS "lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_dynamic" BOOLEAN NOT NULL DEFAULT false,
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lists_organization_id_idx" ON "lists"("organization_id");
CREATE INDEX IF NOT EXISTS "lists_created_by_idx" ON "lists"("created_by");
DROP TRIGGER IF EXISTS update_lists_updated_at ON "lists";
CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON "lists" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: list_contacts
CREATE TABLE IF NOT EXISTS "list_contacts" (
    "list_id" UUID NOT NULL REFERENCES "lists"("id") ON DELETE CASCADE,
    "contact_id" UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("list_id", "contact_id")
);
CREATE INDEX IF NOT EXISTS "list_contacts_list_id_idx" ON "list_contacts"("list_id");
CREATE INDEX IF NOT EXISTS "list_contacts_contact_id_idx" ON "list_contacts"("contact_id");

-- Tabela: custom_field_definitions
CREATE TABLE IF NOT EXISTS "custom_field_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB NOT NULL DEFAULT '[]',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE ("organization_id", "key")
);
CREATE INDEX IF NOT EXISTS "custom_field_definitions_organization_id_idx" ON "custom_field_definitions"("organization_id");
CREATE INDEX IF NOT EXISTS "custom_field_definitions_is_active_idx" ON "custom_field_definitions"("is_active");
DROP TRIGGER IF EXISTS update_custom_field_definitions_updated_at ON "custom_field_definitions";
CREATE TRIGGER update_custom_field_definitions_updated_at
    BEFORE UPDATE ON "custom_field_definitions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: contact_custom_field_values
CREATE TABLE IF NOT EXISTS "contact_custom_field_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
    "field_id" UUID NOT NULL REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE,
    "value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE ("contact_id", "field_id")
);
CREATE INDEX IF NOT EXISTS "contact_custom_field_values_contact_id_idx" ON "contact_custom_field_values"("contact_id");
CREATE INDEX IF NOT EXISTS "contact_custom_field_values_field_id_idx" ON "contact_custom_field_values"("field_id");
DROP TRIGGER IF EXISTS update_contact_custom_field_values_updated_at ON "contact_custom_field_values";
CREATE TRIGGER update_contact_custom_field_values_updated_at
    BEFORE UPDATE ON "contact_custom_field_values" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: segments
CREATE TABLE IF NOT EXISTS "segments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL DEFAULT '[]',
    "contact_count" INTEGER NOT NULL DEFAULT 0,
    "last_calculated_at" TIMESTAMP(3),
    "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "segments_organization_id_idx" ON "segments"("organization_id");
CREATE INDEX IF NOT EXISTS "segments_created_by_idx" ON "segments"("created_by");
DROP TRIGGER IF EXISTS update_segments_updated_at ON "segments";
CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON "segments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: organization_members
CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE ("organization_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "organization_members_organization_id_idx" ON "organization_members"("organization_id");
CREATE INDEX IF NOT EXISTS "organization_members_user_id_idx" ON "organization_members"("user_id");
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON "organization_members";
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON "organization_members" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Inserir usuário admin se não existir
INSERT INTO "users" ("id", "email", "name", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@aurea.com', 'Admin', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed tags
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "tags" LIMIT 1) THEN
        INSERT INTO "tags" ("organization_id", "name", "color", "source")
        SELECT o."id", tag.name, tag.color, tag.source
        FROM "organizations" o
        CROSS JOIN (VALUES
            ('Lead Quente', '#ef4444', 'manual'),
            ('Cliente VIP', '#f59e0b', 'manual'),
            ('Reengajamento', '#8b5cf6', 'automation'),
            ('Newsletter', '#06b6d4', 'utm'),
            ('Indicação', '#10b981', 'manual'),
            ('Trial Ativo', '#3b82f6', 'automation'),
            ('Churned', '#6b7280', 'automation')
        ) AS tag(name, color, source)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Seed custom fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "custom_field_definitions" LIMIT 1) THEN
        INSERT INTO "custom_field_definitions" ("organization_id", "name", "key", "type", "required", "display_order")
        SELECT o."id", f.name, f.key, f.type, f.required::boolean, f.ord::int
        FROM "organizations" o
        CROSS JOIN (VALUES
            ('CPF', 'cpf', 'text', 'false', 1),
            ('Data de Nascimento', 'birth_date', 'date', 'false', 2),
            ('Cargo', 'job_title', 'text', 'false', 3),
            ('Empresa', 'company', 'text', 'false', 4),
            ('Segmento', 'segment', 'select', 'false', 5),
            ('Origem do Lead', 'lead_source', 'select', 'false', 6)
        ) AS f(name, key, type, required, ord)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Seed lists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "lists" LIMIT 1) THEN
        INSERT INTO "lists" ("organization_id", "name", "description")
        SELECT o."id", l.name, l.description
        FROM "organizations" o
        CROSS JOIN (VALUES
            ('Leads Ativos', 'Leads em processo de qualificação'),
            ('Clientes', 'Clientes com contrato ativo'),
            ('Newsletter', 'Inscritos na newsletter'),
            ('Inativos', 'Contatos sem interação nos últimos 90 dias')
        ) AS l(name, description)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- Seed segments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "segments" LIMIT 1) THEN
        INSERT INTO "segments" ("organization_id", "name", "description", "rules")
        SELECT o."id", s.name, s.description, s.rules::jsonb
        FROM "organizations" o
        CROSS JOIN (VALUES
            ('Leads Qualificados', 'Leads com score acima de 70', '[{"field":"score","operator":"gte","value":70}]'),
            ('Clientes em Risco', 'Sem compra nos últimos 60 dias', '[{"field":"last_purchase_days","operator":"gte","value":60}]')
        ) AS s(name, description, rules)
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;
