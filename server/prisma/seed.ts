import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Account and Access', 'Hardware', 'Software', 'Network'];

const REQUESTER_USERS = [
  { name: 'Aran Suksawat', email: 'aran.s@example.edu', active: true },
  { name: 'Bhumi Chaiyasit', email: 'bhumi.c@example.edu', active: true },
  { name: 'Chanya Rattanakosin', email: 'chanya.r@example.edu', active: true },
  { name: 'Danai Preechapong', email: 'danai.p@example.edu', active: true },
  { name: 'Ekkarin Wongsawat', email: 'ekkarin.w@example.edu', active: false },
];

const RELATED_SYSTEMS = [
  'Email',
  'Campus Wi-Fi',
  'VPN',
  'LEB2 App',
  'Grade Submission App',
  'Printer',
  'Corporate Laptop',
];

async function main() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const requester of REQUESTER_USERS) {
    await prisma.requesterUser.upsert({
      where: { email: requester.email },
      update: {},
      create: requester,
    });
  }

  for (const name of RELATED_SYSTEMS) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
