import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const voices = await prisma.voice.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log('voices:', voices);
}
main().catch(console.error).finally(() => prisma.$disconnect());
