-- ============================================
-- FIX RÁPIDO: Apenas adicionar coluna status faltante
-- ============================================

-- 1. Criar o enum OrganizationStatus (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationStatus') THEN
        CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
END
$$;

-- 2. Adicionar coluna status em organizations (se não existir)
ALTER TABLE "organizations" 
ADD COLUMN IF NOT EXISTS "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';

-- 3. Atualizar registros existentes que possam ter status nulo
UPDATE "organizations" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Verificar se funcionou
SELECT 'Coluna status adicionada com sucesso!' as result;
