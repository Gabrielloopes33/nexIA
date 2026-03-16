-- ============================================
-- FIX COMPLETO: Adicionar TODAS as colunas faltantes
-- ============================================

-- 1. Criar Enums (se não existirem)
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

-- 2. Verificar e adicionar colunas na tabela organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'status') THEN
        ALTER TABLE "organizations" ADD COLUMN "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'owner_id') THEN
        ALTER TABLE "organizations" ADD COLUMN "owner_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'logo_url') THEN
        ALTER TABLE "organizations" ADD COLUMN "logo_url" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'feature_flags') THEN
        ALTER TABLE "organizations" ADD COLUMN "feature_flags" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'settings') THEN
        ALTER TABLE "organizations" ADD COLUMN "settings" JSONB;
    END IF;
END
$$;

-- 3. Verificar e adicionar colunas na tabela contacts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'organization_id') THEN
        ALTER TABLE "contacts" ADD COLUMN "organization_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone') THEN
        ALTER TABLE "contacts" ADD COLUMN "phone" VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'name') THEN
        ALTER TABLE "contacts" ADD COLUMN "name" VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'avatar_url') THEN
        ALTER TABLE "contacts" ADD COLUMN "avatar_url" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'metadata') THEN
        ALTER TABLE "contacts" ADD COLUMN "metadata" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tags') THEN
        ALTER TABLE "contacts" ADD COLUMN "tags" TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lead_score') THEN
        ALTER TABLE "contacts" ADD COLUMN "lead_score" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'status') THEN
        ALTER TABLE "contacts" ADD COLUMN "status" "ContactStatus" DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_interaction_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "last_interaction_at" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'deleted_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "deleted_at" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'updated_at') THEN
        ALTER TABLE "contacts" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- 4. Verificar e adicionar colunas na tabela users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE "users" ADD COLUMN "email" VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE "users" ADD COLUMN "name" VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- 5. Verificar e adicionar colunas na tabela organization_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'organization_id') THEN
        ALTER TABLE "organization_members" ADD COLUMN "organization_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'user_id') THEN
        ALTER TABLE "organization_members" ADD COLUMN "user_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'role') THEN
        ALTER TABLE "organization_members" ADD COLUMN "role" "OrganizationRole" DEFAULT 'MEMBER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'status') THEN
        ALTER TABLE "organization_members" ADD COLUMN "status" "MemberStatus" DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_members' AND column_name = 'joined_at') THEN
        ALTER TABLE "organization_members" ADD COLUMN "joined_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
    END IF;
END
$$;

-- 6. Atualizar valores nulos
UPDATE "organizations" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
UPDATE "contacts" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
UPDATE "contacts" SET "lead_score" = 0 WHERE "lead_score" IS NULL;

SELECT 'Colunas verificadas e adicionadas!' as result;
