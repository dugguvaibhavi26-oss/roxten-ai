import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Intelligent Search: Retrieve prioritized knowledge instead of dumping everything
    // We'll prioritize businessKnowledge (policies/sops), DNA, and recent active tasks
    const [knowledge, dnaRec, tasks, insights] = await Promise.all([
      prisma.businessKnowledge.findMany({ where: { businessId }, take: 40, orderBy: { createdAt: 'desc' } }),
      prisma.memory.findFirst({ where: { businessId, key: 'COMPANY_DNA' } }),
      prisma.task.findMany({ where: { businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } }, take: 20, include: { employee: true }, orderBy: { createdAt: 'desc' } }),
      prisma.businessInsight.findMany({ where: { businessId }, take: 10, orderBy: { createdAt: 'desc' } })
    ]);

    let dnaString = 'No Company DNA defined.';
    if (dnaRec) {
      try {
        const parsed = JSON.parse(dnaRec.value);
        dnaString = `Mission: ${parsed.mission}\nCore Values: ${parsed.coreValues?.join(', ')}\nRules: ${parsed.operationalRules?.join(', ')}`;
      } catch(e) {}
    }

    const context = `
[COMPANY DNA]
${dnaString}

[KNOWLEDGE GRAPH & SOPs]
${knowledge.map(k => `[Source: ${k.sourceReference || 'Document'}] ${k.title}: ${k.content}`).join('\n\n')}

[ACTIVE TASKS]
${tasks.map(t => `[Source: Task Center] ${t.title} (Assigned to: ${t.employee?.name})`).join('\n')}

[STRATEGIC INSIGHTS]
${insights.map(i => `[Source: Brain Insight] ${i.title}: ${i.description}`).join('\n')}
`;

    const llm = new GroqProvider();
    
    const prompt = `You are the Company Brain, an omniscient AI that serves as the intelligence layer of the organization.
You must answer the user's query using ONLY the provided Context Graph below. Do not invent information.

If the answer is not in the context, state that you do not have records of it.

CONTEXT GRAPH:
${context}

User Question: ${query}

You MUST return a valid JSON object with the following structure:
{
  "answer": "Your detailed answer",
  "sources": ["List", "of", "sources", "referenced in the context"],
  "confidence": 95
}`;

    const jsonSchema = {
      type: "object",
      properties: {
        answer: { type: "string" },
        sources: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["answer", "sources"]
    };

    const responseJSON = await llm.generateJSON(prompt, jsonSchema) as any;

    return NextResponse.json({
      answer: responseJSON?.answer || 'I could not synthesize an answer.',
      sources: responseJSON?.sources || [],
      confidence: responseJSON?.confidence || 0
    });
  } catch (error: any) {
    console.error('Brain Query Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

