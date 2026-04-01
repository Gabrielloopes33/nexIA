-- Add LINKEDIN to ChannelType enum
ALTER TYPE "ChannelType" ADD VALUE IF NOT EXISTS 'LINKEDIN';

-- Add LINKEDIN to IntegrationType enum
ALTER TYPE "IntegrationType" ADD VALUE IF NOT EXISTS 'LINKEDIN';

-- Add email column to contacts table
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);

-- Create index on contacts(organization_id, email)
CREATE INDEX IF NOT EXISTS "contacts_organization_id_email_idx" ON "contacts"("organization_id", "email");

-- CreateTable linkedin_integrations
CREATE TABLE IF NOT EXISTS "linkedin_integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "linkedin_member_id" VARCHAR(100),
    "linkedin_member_name" VARCHAR(255),
    "linkedin_member_email" VARCHAR(255),
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "ad_account_id" VARCHAR(100),
    "ad_account_name" VARCHAR(255),
    "selected_form_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "pipeline_id" UUID,
    "product_id" UUID,
    "webhook_subscription_id" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "last_lead_at" TIMESTAMPTZ(6),
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_integrations_organization_id_key" ON "linkedin_integrations"("organization_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "linkedin_integrations_organization_id_idx" ON "linkedin_integrations"("organization_id");
