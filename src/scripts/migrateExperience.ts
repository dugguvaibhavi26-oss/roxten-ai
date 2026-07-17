import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany();
  for (const emp of employees) {
    const isMale = emp.selectedVoiceId?.includes('am_') || false;
    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        voiceId: emp.selectedVoiceId || 'kokoro-af_bella',
        voiceProvider: 'Kokoro',
        gender: isMale ? 'Male' : 'Female',
        accent: 'American',
        speakingStyle: emp.personality || 'Professional',
        mood: 'Neutral',
        temperature: 0.6
      }
    });
  }
  console.log(`Migrated ${employees.length} employees.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
