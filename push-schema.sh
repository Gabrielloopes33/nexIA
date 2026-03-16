#!/bin/bash
# Script para executar prisma db push no VPS

cd /root/supabase/docker

# Criar arquivo .env temporário
cat > .env.prisma << 'EOF'
DATABASE_URL=postgresql://supabase_admin:d7e99a8ab8c2edfdb9daef4e383f1ce1@supabase_db:5432/postgres
EOF

# Copiar schema.prisma
mkdir -p prisma
cat > prisma/schema.prisma << 'SCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelos principais (simplificados)
model Organization {
  id                     String   @id @default(uuid())
  name                   String
  slug                   String   @unique
  ownerId                String   @map("owner_id")
  logoUrl                String?  @map("logo_url")
  featureFlags           Json?    @map("feature_flags")
  settings               Json?
  status                 String   @default("ACTIVE")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  @@map("organizations")
}

model Deal {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  contactId         String   @map("contact_id")
  stageId           String   @map("stage_id")
  unitId            String?  @map("unit_id")
  title             String
  description       String?
  amount            Decimal? @db.Decimal(15, 2)
  currency          String   @default("BRL")
  leadScore         Int      @default(0) @map("lead_score")
  probability       Int?
  expectedCloseDate DateTime? @map("expected_close_date")
  actualCloseDate   DateTime? @map("actual_close_date")
  source            String?
  sourceId          String?  @map("source_id")
  assignedTo        String?  @map("assigned_to")
  status            String   @default("OPEN")
  priority          String   @default("MEDIUM")
  metadata          Json?
  tags              String[]
  lostReason        String?
  closedLostAt      DateTime? @map("closed_lost_at")
  closedWonAt       DateTime? @map("closed_won_at")
  channel           String   @default("WHATSAPP_OFFICIAL")
  utmSource         String?  @map("utm_source")
  estimatedValue    Float    @default(0) @map("estimated_value")
  qualifiedAt       DateTime? @map("qualified_at")
  proposalSentAt    DateTime? @map("proposal_sent_at")
  negotiationAt     DateTime? @map("negotiation_at")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("deals")
}

model MonthlyGoal {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  month          DateTime
  targetRevenue  Float    @default(0) @map("target_revenue")
  targetDeals    Int      @default(0) @map("target_deals")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([organizationId, month])
  @@map("monthly_goals")
}
SCHEMA

# Executar prisma db push
docker run --rm --network NexiaCRM \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/.env.prisma:/app/.env \
  -e DATABASE_URL="postgresql://supabase_admin:d7e99a8ab8c2edfdb9daef4e383f1ce1@supabase_db:5432/postgres" \
  node:18-alpine sh -c "npx prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss"

# Limpar
rm -f .env.prisma
rm -rf prisma

echo "Schema atualizado!"
