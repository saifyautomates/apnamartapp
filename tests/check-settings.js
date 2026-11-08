const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.setting.findMany();
  console.log('Settings in DB count:', settings.length);
  for (const s of settings) {
    console.log(s.key, '->', JSON.stringify(s.value));
  }
}
main().finally(() => prisma.$disconnect());
