import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const user1 = await prisma.iaiUser.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      membershipNumber: 'IAI-2024-001',
      straNumber: 'STR-000001',
      lastPaymentAt: new Date('2025-11-15'),
    },
  });

  const user2 = await prisma.iaiUser.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      membershipNumber: 'IAI-2024-002',
      straNumber: 'STR-000002',
      lastPaymentAt: new Date('2025-11-20'),
    },
  });

  console.log({ user1, user2 });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
