const { PrismaClient } = require('@prisma/client');

async function waitForDb(retries = 30, delay = 2000) {
  const prisma = new PrismaClient();
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      await prisma.$disconnect();
      console.log('Database ready!');
      process.exit(0);
    } catch {
      console.log(`Waiting for database (attempt ${i}/${retries})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('Database not available after max retries');
  process.exit(1);
}

waitForDb();
