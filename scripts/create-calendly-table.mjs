import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS calendly_integrations (
      id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id           UUID NOT NULL UNIQUE,
      access_token              TEXT NOT NULL,
      calendly_user_uri         VARCHAR(500),
      calendly_organization_uri VARCHAR(500),
      calendly_user_name        VARCHAR(255),
      calendly_user_email       VARCHAR(255),
      webhook_subscription_uri  VARCHAR(500),
      signing_key               TEXT,
      status                    VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      total_bookings            INTEGER NOT NULL DEFAULT 0,
      last_booking_at           TIMESTAMPTZ,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS calendly_integrations_organization_id_idx
      ON calendly_integrations (organization_id)
  `)

  console.log('✓ Tabela calendly_integrations criada com sucesso!')
}

main()
  .catch((e) => { console.error('Erro:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
