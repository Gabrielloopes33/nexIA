#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function hasActiveMembership(userId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM organization_members 
    WHERE user_id = ${userId}::uuid AND status = 'ACTIVE'
  `;
  return Number(result[0].count) > 0;
}

async function getFirstOrganization() {
  const result = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
    SELECT id, name FROM organizations WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1
  `;
  return result[0] || null;
}

async function createMembership(userId: string, organizationId: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO organization_members (id, organization_id, user_id, role, status, joined_at, created_at, updated_at)
    VALUES (gen_random_uuid(), ${organizationId}::uuid, ${userId}::uuid, 'OWNER', 'ACTIVE', NOW(), NOW(), NOW())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'OWNER', status = 'ACTIVE', updated_at = NOW()
  `;
}

async function main() {
  console.log('🔧 Corrigindo organizações...\n');
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, organizationId: true },
  });

  let fixed = 0;
  let ok = 0;

  for (const user of users) {
    const hasActive = await hasActiveMembership(user.id);
    
    if (hasActive) {
      console.log(`✅ ${user.email} - já OK`);
      ok++;
      continue;
    }

    const org = await getFirstOrganization();
    if (org) {
      await createMembership(user.id, org.id);
      console.log(`🔧 ${user.email} - vinculado a ${org.name}`);
      fixed++;
    } else {
      console.log(`❌ ${user.email} - sem organização disponível`);
    }
  }

  console.log(`\n📊 Total: ${users.length}, OK: ${ok}, Corrigidos: ${fixed}`);
  await prisma.$disconnect();
}

main();
