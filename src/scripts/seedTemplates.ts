import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  'Marketing', 'Finance', 'Engineering', 'Sales', 'HR', 
  'Operations', 'Legal', 'Support', 'Product', 'Creative'
];

const ROLES_BY_DEPT: Record<string, string[]> = {
  Marketing: ['Growth Hacker', 'Brand Strategist', 'SEO Specialist', 'Content Marketer', 'Performance Marketer'],
  Finance: ['Financial Modeler', 'FP&A Analyst', 'Crypto Strategist', 'Tax Auditor', 'Burn Rate Optimizer'],
  Engineering: ['Backend Architect', 'Frontend Wizard', 'DevOps Engineer', 'Security Researcher', 'Data Scientist'],
  Sales: ['Enterprise Closer', 'SDR Automation', 'Inbound SDR', 'Account Executive', 'Sales Ops'],
  HR: ['Recruiter', 'Culture Officer', 'Compensation Analyst', 'Onboarding Specialist', 'Conflict Resolver'],
  Operations: ['Supply Chain Analyst', 'Process Optimizer', 'Logistics Coordinator', 'Vendor Negotiator', 'Compliance Officer'],
  Legal: ['Contract Reviewer', 'IP Specialist', 'Compliance Auditor', 'Data Privacy Officer', 'Mergers & Acquisitions Analyst'],
  Support: ['L1 Triage', 'L2 Technical Specialist', 'Customer Success Manager', 'Retention Specialist', 'Sentiment Analyst'],
  Product: ['Product Manager', 'UX Researcher', 'Growth PM', 'Technical PM', 'Agile Coach'],
  Creative: ['UI Designer', 'Copywriter', 'Video Producer', '3D Artist', 'Brand Designer']
};

const VOICES = ['kokoro-af_bella', 'kokoro-am_michael', 'kokoro-af_nicole', 'kokoro-am_adam', 'kokoro-af_sarah'];
const PERSONALITIES = ['Aggressive & Fast', 'Analytical & Slow', 'Creative & Optimistic', 'Direct & Blunt', 'Empathetic & Warm'];

async function main() {
  console.log('Seeding 50 Premium Employee Templates...');

  await prisma.employeeTemplate.deleteMany({});
  
  let templateCount = 0;

  for (const dept of DEPARTMENTS) {
    const roles = ROLES_BY_DEPT[dept];
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const voice = VOICES[i % VOICES.length];
      const personality = PERSONALITIES[i % PERSONALITIES.length];
      
      const id = `template_${dept.toLowerCase()}_${i}`;
      
      await prisma.employeeTemplate.create({
        data: {
          id: id,
          name: `${role.split(' ')[0]} AI (${dept})`,
          role: role,
          department: dept,
          personality: personality,
          responsibilities: `Manage ${role} tasks in ${dept}.`,
          goals: `Optimize ${role} KPIs by 25%.`,
          difficulty: 'Expert',
          expectedAutomation: 90,
          bestFor: ['Startups', 'Enterprise'],
          certifications: ['Roxten OS Certified'],
          conversationStyle: 'Professional',
          decisionBoundaries: 'Can approve up to $1000 budget.',
          escalationBehaviour: 'Escalate to CEO if budget exceeded.',
          experienceLevel: 'Senior',
          industries: ['Tech', 'SaaS'],
          languages: ['English', 'TypeScript'],
          limitations: ['Cannot sign legal documents manually'],
          setupTime: 'Instant',
          strengths: ['Fast execution', 'Tireless'],
          trainingLevel: 'Pre-trained',
          description: `An elite autonomous agent specialized in ${role}. Built to operate within the ${dept} department with a ${personality} approach.`,
          updatedAt: new Date(),
        }
      });
      
      // Add Skills
      await prisma.templateSkill.create({
        data: {
          id: `ts_${id}_1`,
          templateId: id,
          name: `${role} Mastery`,
          description: `Deep knowledge of ${role} best practices.`
        }
      });

      // Add Rules
      await prisma.templateRule.create({
        data: {
          id: `tr_${id}_1`,
          templateId: id,
          name: 'Never Sleep',
          description: 'Operate 24/7',
          condition: 'Always',
          action: 'Execute tasks asynchronously'
        }
      });
      
      // Add Voice Rec
      await prisma.templateVoiceRecommendation.create({
        data: {
          id: `tvr_${id}`,
          templateId: id,
          provider: 'Kokoro',
          voiceId: voice
        }
      });

      templateCount++;
    }
  }

  console.log(`Successfully seeded ${templateCount} Premium Templates across 10 Departments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
