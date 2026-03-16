-- ============================================
-- MIGRATION COMPLETA: Base + Sprint 1
-- Ordem: 1) Base Schema → 2) Sprint 1 Contacts Core
-- ============================================

-- ============================================
-- PARTE 1: BASE SCHEMA (20250311000000_base_schema)
-- ============================================

-- Migration: Base Schema
-- Tabelas base necessárias antes das migrations do Sprint 1
-- Tabelas: users, organizations, organization_members, organization_units, contacts
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
