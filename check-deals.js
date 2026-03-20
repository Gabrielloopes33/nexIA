const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const deals = await prisma.deal.findMany({
    where: { organizationId: '4abc52ff-a02e-47c8-9beb-a23c0cd25ba7' },
    select: {
      id: true,
      title: true,
      value: true,
      amount: true,
      estimatedValue: true,
    }
  });
  
  console.log('Deals encontrados:');
  deals.forEach(d => {
    console.log({
      id: d.id,
      title: d.title,
      value: d.value?.toString(),
      amount: d.amount?.toString(),
      estimatedValue: d.estimatedValue
    });
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
