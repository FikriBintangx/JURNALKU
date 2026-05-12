import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
