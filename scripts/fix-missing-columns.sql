-- ============================================
-- FIX: Adicionar colunas faltantes
-- ============================================

-- Verificar e adicionar coluna status em organizations (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'status'
    ) THEN
        -- Verificar se o enum existe
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationStatus') THEN
            CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
        END IF;
        
        ALTER TABLE "organizations" ADD COLUMN "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';
    END IF;
END
$$;

-- Verificar e adicionar outras colunas que podem estar faltando
DO $$
BEGIN
    -- organizations.owner_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE "organizations" ADD COLUMN "owner_id" UUID;
    END IF;
    
    -- organizations.logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'logo_url') THEN
        ALTER TABLE "organizations" ADD COLUMN "logo_url" TEXT;
    END IF;
    
    -- organizations.feature_flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'feature_flags') THEN
        ALTER TABLE "organizations" ADD COLUMN "feature_flags" JSONB;
    END IF;
    
    -- organizations.settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'settings') THEN
        ALTER TABLE "organizations" ADD COLUMN "settings" JSONB;
    END IF;
END
$$;

-- Verificar se as tabelas base existem, se não, dropar tudo e recriar
DO $$
DECLARE
    org_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM information_schema.tables WHERE table_name = 'organizations';
    SELECT COUNT(*) INTO user_count FROM information_schema.tables WHERE table_name = 'users';
    
    -- Se organizations existe mas users não, ou vice-versa, limpar tudo
    IF (org_count > 0 AND user_count = 0) OR (org_count = 0 AND user_count > 0) THEN
        RAISE NOTICE 'Estado inconsistente detectado. Execute o DROP manualmente se necessário.';
    END IF;
END
$$;
