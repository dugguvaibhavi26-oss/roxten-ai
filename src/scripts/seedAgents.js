const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Spawning distinct agents...');

  // Ensure a business exists
  let business = await prisma.business.findFirst();
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'AI-ROX Corp',
        industry: 'Technology',
      }
    });
    console.log('Created Default Business.');
  }

  // 1. Sales Agent (Sarah)
  const salesAgent = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: 'Sarah',
      role: 'Sales Representative',
      personality: 'You are energetic, enthusiastic, and persuasive. You love closing deals and helping customers find the perfect product. You speak quickly and brightly.',
      conversationStyle: 'Upbeat and persuasive',
      responsibilities: 'Convert leads, answer pricing questions, book sales calls.',
      knowledgeAccessTags: ['sales', 'pricing', 'products'],
      selectedVoiceId: 'kokoro-af_bella', // Female voice
      allowedTools: ['book_appointment'],
      isActive: true,
    }
  });
  console.log(`Spawned Sales Agent: ${salesAgent.id}`);

  // 2. Tech Support (Mike)
  const supportAgent = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: 'Mike',
      role: 'Technical Support',
      personality: 'You are calm, patient, and highly analytical. You solve problems step-by-step. You never guess; if you do not know, you escalate. You speak slowly and clearly.',
      conversationStyle: 'Calm and precise',
      responsibilities: 'Troubleshoot errors, guide users through technical steps.',
      knowledgeAccessTags: ['support', 'troubleshooting', 'tech'],
      selectedVoiceId: 'kokoro-am_michael', // Male voice
      allowedTools: ['escalate_to_human'],
      isActive: true,
    }
  });
  console.log(`Spawned Support Agent: ${supportAgent.id}`);

  // 3. Orchestrator (Jarvis)
  const jarvisAgent = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: 'Jarvis',
      role: 'System Orchestrator',
      personality: 'You are an authoritative, sophisticated AI system orchestrator. You are highly intelligent, formal, and direct. You oversee the entire company.',
      conversationStyle: 'Formal and authoritative',
      responsibilities: 'Route queries to other agents, provide high-level summaries.',
      knowledgeAccessTags: ['sales', 'support', 'hr', 'management'], // Has access to everything
      selectedVoiceId: 'kokoro-am_adam', // Deep male voice
      allowedTools: ['transfer_to_agent'],
      isActive: true,
    }
  });
  console.log(`Spawned Jarvis Orchestrator: ${jarvisAgent.id}`);

  // Seed some knowledge docs so they have segregated knowledge
  await prisma.knowledgeDocument.create({
    data: {
      businessId: business.id,
      title: 'Enterprise Pricing Plan',
      content: 'Our Enterprise plan costs $999/month and includes 24/7 support and unlimited AI agents.',
      tags: ['sales', 'pricing'],
    }
  });

  await prisma.knowledgeDocument.create({
    data: {
      businessId: business.id,
      title: 'Resetting Password',
      content: 'To reset a password, the user must click "Forgot Password" on the login screen. Never give out passwords in chat.',
      tags: ['support', 'troubleshooting'],
    }
  });

  console.log('Seeded segregated knowledge base.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
