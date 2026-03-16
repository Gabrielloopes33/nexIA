#!/usr/bin/env tsx
/**
 * Script de migração do Sprint 1 - Contatos (Core)
 * Cria tabelas: tags, contact_tags, lists, list_contacts, 
 * custom_field_definitions, contact_custom_field_values, segments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIGRATION_SQL = `
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
`;

const SEED_SQL = `
-- =============================================
-- SEED SPRINT 1: Tags, Campos, Listas, Segmentos
-- =============================================

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

async function main() {
  console.log('🚀 Iniciando migração do Sprint 1 - Contatos (Core)...\n');

  try {
    // 1. Verificar conexão
    console.log('📡 Verificando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!\n');

    // 2. Executar migração SQL
    console.log('🔄 Criando tabelas do Sprint 1...');
    await prisma.$executeRawUnsafe(MIGRATION_SQL);
    console.log('✅ Tabelas criadas com sucesso!\n');

    // 3. Executar seed
    console.log('🌱 Executando seed data...');
    await prisma.$executeRawUnsafe(SEED_SQL);
    console.log('✅ Seed data inserido!\n');

    // 4. Verificar tabelas criadas
    console.log('📊 Verificando tabelas do Sprint 1...');
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('tags', 'contact_tags', 'lists', 'list_contacts', 
                        'custom_field_definitions', 'contact_custom_field_values', 'segments')
      ORDER BY tablename;
    `;
    console.log('📋 Tabelas do Sprint 1:');
    (tables as any[]).forEach((t) => console.log(`   ✅ ${t.tablename}`));

    // 5. Verificar coluna deleted_at
    console.log('\n📊 Verificando coluna deleted_at na tabela contacts...');
    const deletedAtCol = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'contacts' AND column_name = 'deleted_at';
    `;
    if ((deletedAtCol as any[]).length > 0) {
      console.log('   ✅ Coluna deleted_at existe na tabela contacts');
    } else {
      console.log('   ❌ Coluna deleted_at NÃO encontrada');
    }

    console.log('\n✅ Migração do Sprint 1 concluída com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
