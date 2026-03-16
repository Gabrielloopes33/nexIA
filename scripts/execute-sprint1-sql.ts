/**
 * Script para executar o SQL do Sprint 1 - Contatos (Core)
 * Este script executa as migrações SQL necessárias para criar as tabelas do Sprint 1
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCHEMA_SQL = `
-- ============================================================
-- SPRINT 1: Contatos (Core) - Schema Aprovado pelo @architect
-- ============================================================

-- ============================================================
-- 1. ADICIONAR deleted_at NA TABELA contacts EXISTENTE
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMPTZ;
        CREATE INDEX idx_contacts_deleted_at ON contacts(deleted_at) WHERE deleted_at IS NULL;
    END IF;
END
$$;

-- ============================================================
-- 2. TABELA: tags
-- ============================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1',
  description TEXT,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_org_isolation" ON tags;
CREATE POLICY "tags_org_isolation" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = tags.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 3. TABELA: contact_tags
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON contact_tags(tag_id);

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_tags_org_isolation" ON contact_tags;
CREATE POLICY "contact_tags_org_isolation" ON contact_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE c.id = contact_tags.contact_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 4. TABELA: lists
-- ============================================================

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  filters JSONB DEFAULT '{}',
  is_dynamic BOOLEAN DEFAULT FALSE,
  contact_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_organization_id ON lists(organization_id);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lists_org_isolation" ON lists;
CREATE POLICY "lists_org_isolation" ON lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = lists.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 5. TABELA: list_contacts
-- ============================================================

CREATE TABLE IF NOT EXISTS list_contacts (
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (list_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_list_contacts_list_id ON list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_list_contacts_contact_id ON list_contacts(contact_id);

ALTER TABLE list_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_contacts_org_isolation" ON list_contacts;
CREATE POLICY "list_contacts_org_isolation" ON list_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lists l
      JOIN organization_members om ON l.organization_id = om.organization_id
      WHERE l.id = list_contacts.list_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 6. TABELA: custom_field_definitions
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  options JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON custom_field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_is_active ON custom_field_definitions(is_active);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_fields_org_isolation" ON custom_field_definitions;
CREATE POLICY "custom_fields_org_isolation" ON custom_field_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = custom_field_definitions.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 7. TABELA: contact_custom_field_values
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_contact ON contact_custom_field_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON contact_custom_field_values(field_id);

ALTER TABLE contact_custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_field_values_org_isolation" ON contact_custom_field_values;
CREATE POLICY "custom_field_values_org_isolation" ON contact_custom_field_values
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contacts c
      JOIN organization_members om ON c.organization_id = om.organization_id
      WHERE c.id = contact_custom_field_values.contact_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );

-- ============================================================
-- 8. TABELA: segments
-- ============================================================

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  rules JSONB DEFAULT '[]',
  contact_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_organization_id ON segments(organization_id);

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "segments_org_isolation" ON segments;
CREATE POLICY "segments_org_isolation" ON segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = segments.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
    )
  );
`;

const SEED_SQL = `
-- Tags base
INSERT INTO tags (organization_id, name, color, source)
SELECT o.id, tag.name, tag.color, tag.source
FROM organizations o,
(VALUES
  ('Lead Quente', '#ef4444', 'manual'),
  ('Cliente VIP', '#f59e0b', 'manual'),
  ('Reengajamento', '#8b5cf6', 'automation'),
  ('Newsletter', '#06b6d4', 'utm'),
  ('Indicação', '#10b981', 'manual'),
  ('Trial Ativo', '#3b82f6', 'automation'),
  ('Churned', '#6b7280', 'automation')
) AS tag(name, color, source)
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

-- Campos customizados
INSERT INTO custom_field_definitions (organization_id, name, key, type, required, display_order)
SELECT o.id, f.name, f.key, f.type, f.required::boolean, f.ord::int
FROM organizations o,
(VALUES
  ('CPF', 'cpf', 'text', 'false', '1'),
  ('Data de Nascimento', 'birth_date', 'date', 'false', '2'),
  ('Cargo', 'job_title', 'text', 'false', '3'),
  ('Empresa', 'company', 'text', 'false', '4'),
  ('Segmento', 'segment', 'select', 'false', '5'),
  ('Origem do Lead', 'lead_source', 'select', 'false', '6')
) AS f(name, key, type, required, ord)
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

-- Listas de contatos
INSERT INTO lists (organization_id, name, description)
SELECT o.id, l.name, l.description
FROM organizations o,
(VALUES
  ('Leads Ativos', 'Leads em processo de qualificação'),
  ('Clientes', 'Clientes com contrato ativo'),
  ('Newsletter', 'Inscritos na newsletter'),
  ('Inativos', 'Contatos sem interação nos últimos 90 dias')
) AS l(name, description)
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;

-- Segmentos
INSERT INTO segments (organization_id, name, description, rules)
SELECT o.id, s.name, s.description, s.rules::jsonb
FROM organizations o,
(VALUES
  ('Leads Qualificados', 'Leads com score acima de 70', '[{"field":"score","operator":"gte","value":70}]'),
  ('Clientes em Risco', 'Sem compra nos últimos 60 dias', '[{"field":"last_purchase_days","operator":"gte","value":60}]')
) AS s(name, description, rules)
WHERE o.status = 'ACTIVE'
ON CONFLICT DO NOTHING;
`;

async function executeSQL() {
  console.log('🚀 Executando SQL do Sprint 1 - Contatos (Core)...\n');

  try {
    // Executar schema SQL
    console.log('📊 Criando tabelas, índices e políticas RLS...');
    await prisma.$executeRawUnsafe(SCHEMA_SQL);
    console.log('✅ Schema criado com sucesso!\n');

    // Executar seed SQL
    console.log('🌱 Inserindo seed data...');
    await prisma.$executeRawUnsafe(SEED_SQL);
    console.log('✅ Seed data inserido com sucesso!\n');

    console.log('✨ Sprint 1 executado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeSQL();
