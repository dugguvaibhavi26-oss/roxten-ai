import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const voiceId = 'custom_1783915725431';
  const versionId = '9befaea0-4323-4059-a66c-0d8199f22e38';
  
  try {
    const benchmark = await prisma.voiceBenchmark.create({
      data: {
        voiceId: voiceId,
        versionId: versionId,
        validationScore: 100.0,
        speechQualityScore: 90.0,
        transcriptionConfidence: 0.9,
        snr: 0.0,
        processingTimeMs: 1000,
        cloneTimeMs: 2000,
        totalPipelineTimeMs: 3000,
        sampleRate: 24000,
        durationSeconds: 1.5,
        speechRate: 10
      }
    });
    console.log('SUCCESS:', benchmark);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
