require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.evolutionInstance.findMany();
  console.log('Instâncias no banco:');
  instances.forEach((i: any) => {
    console.log(`  - ${i.name} (${i.instanceName}) - Status: ${i.status}`);
  });
  await prisma.$disconnect();
}

main().catch((e: any) => { console.error(e); process.exit(1); });
