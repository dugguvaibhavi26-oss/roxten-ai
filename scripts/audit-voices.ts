import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const voices = [
  // English (US)
  {
    id: 'voice-eleven-rachel',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    displayName: 'Rachel',
    provider: 'ElevenLabs',
    gender: 'female',
    accent: 'American',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'empathic', 'professional'],
    description: 'A warm, professional American female voice perfect for customer support and general assistance.',
    quality: 'HIGH',
    tags: ['Support', 'Friendly', 'Professional'],
    supportedLanguages: ['en-US'],
  },
  {
    id: 'voice-eleven-clyde',
    voiceId: '2EiwWnXFnvU5JabPnv8n',
    displayName: 'Clyde',
    provider: 'ElevenLabs',
    gender: 'male',
    accent: 'American',
    category: 'Narrative',
    type: 'GLOBAL',
    capabilities: ['narrative', 'authoritative', 'sales'],
    description: 'A deep, confident American male voice suited for sales, marketing, and leadership roles.',
    quality: 'HIGH',
    tags: ['Sales', 'Corporate', 'Authoritative'],
    supportedLanguages: ['en-US'],
  },
  // English (UK)
  {
    id: 'voice-openai-alloy',
    voiceId: 'alloy',
    displayName: 'Alloy',
    provider: 'OpenAI',
    gender: 'neutral',
    accent: 'British',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'versatile'],
    description: 'A versatile, modern voice that works well for diverse, fast-paced environments.',
    quality: 'PREMIUM',
    tags: ['Modern', 'Versatile'],
    supportedLanguages: ['en-GB', 'en-US'],
  },
  {
    id: 'voice-eleven-fin',
    voiceId: 'AZnzlk1XvdvUeBnXmlld',
    displayName: 'Fin',
    provider: 'ElevenLabs',
    gender: 'male',
    accent: 'Irish',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'friendly'],
    description: 'An approachable, friendly Irish male voice perfect for building rapport.',
    quality: 'HIGH',
    tags: ['Friendly', 'Casual'],
    supportedLanguages: ['en-IE', 'en-GB'],
  },
  // Indian English & Hindi
  {
    id: 'voice-azure-neerja',
    voiceId: 'en-IN-NeerjaNeural',
    displayName: 'Neerja',
    provider: 'Azure',
    gender: 'female',
    accent: 'Indian English',
    category: 'Support',
    type: 'GLOBAL',
    capabilities: ['support', 'professional'],
    description: 'A clear, highly professional Indian English female voice ideal for enterprise customer support.',
    quality: 'STANDARD',
    tags: ['Professional', 'Medical', 'Support'],
    supportedLanguages: ['en-IN', 'hi-IN'],
  },
  {
    id: 'voice-azure-prabhat',
    voiceId: 'en-IN-PrabhatNeural',
    displayName: 'Prabhat',
    provider: 'Azure',
    gender: 'male',
    accent: 'Indian English',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'sales'],
    description: 'An enthusiastic Indian English male voice, great for sales pitching and outreach.',
    quality: 'STANDARD',
    tags: ['Sales', 'Energetic'],
    supportedLanguages: ['en-IN', 'hi-IN'],
  },
  {
    id: 'voice-google-hindi-female',
    voiceId: 'hi-IN-Neural2-A',
    displayName: 'Aarti',
    provider: 'Google',
    gender: 'female',
    accent: 'Hindi',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'regional'],
    description: 'A native Hindi speaking female voice with excellent clarity.',
    quality: 'STANDARD',
    tags: ['Regional', 'Friendly'],
    supportedLanguages: ['hi-IN'],
  },
  {
    id: 'voice-google-hindi-male',
    voiceId: 'hi-IN-Neural2-B',
    displayName: 'Rajesh',
    provider: 'Google',
    gender: 'male',
    accent: 'Hindi',
    category: 'Conversational',
    type: 'GLOBAL',
    capabilities: ['conversational', 'regional'],
    description: 'A native Hindi speaking male voice with a calm, assuring tone.',
    quality: 'STANDARD',
    tags: ['Regional', 'Calm'],
    supportedLanguages: ['hi-IN'],
  }
];

async function main() {
  console.log('Starting Voice Marketplace Audit...');
  
  // 1. Delete all existing voices to remove duplicates
  console.log('Purging existing voices...');
  await prisma.voice.deleteMany({});
  console.log('Cleared existing voices.');

  // 2. Insert curated voices
  console.log('Inserting audited voices...');
  let count = 0;
  for (const v of voices) {
    await prisma.voice.create({
      data: { ...v, updatedAt: new Date() },
    });
    count++;
  }
  
  console.log(`✅ Successfully seeded ${count} highly curated, accurate voices.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
