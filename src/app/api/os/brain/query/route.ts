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

    // Pre-fetch activity IDs for the business to bypass mock relational limitations
    const businessActivities = await prisma.activity.findMany({ where: { businessId: business.id } });
    const activityIds = businessActivities.map((a: any) => a.id).slice(0, 10);
    
    // Fetch comprehensive context
    const [memories, knowledge, activities, meetings, tasks, insights, timelineEvents, employees] = await Promise.all([
      prisma.memory.findMany({ where: { businessId: business.id }, take: 100 }),
      prisma.businessKnowledge.findMany({ where: { businessId: business.id } }),
      activityIds.length > 0 ? prisma.activityEvent.findMany({ where: { activityId: { in: activityIds } }, take: 50, orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
      prisma.meeting.findMany({ where: { businessId: business.id }, take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.task.findMany({ where: { businessId: business.id }, take: 50, include: { employee: true }, orderBy: { createdAt: 'desc' } }),
      prisma.businessInsight.findMany({ where: { businessId: business.id }, take: 30, orderBy: { createdAt: 'desc' } }),
      prisma.businessTimelineEvent.findMany({ where: { businessId: business.id }, take: 30, orderBy: { createdAt: 'desc' } }),
      prisma.employee.findMany({ where: { businessId: business.id }, include: { department: true } })
    ]);

    const context = `
COMPANY KNOWLEDGE BASE (KNOWLEDGE GRAPH):

EMPLOYEES (THE WORKFORCE):
${employees.map(e => `- ${e.name} (${e.role} in ${e.department?.name || 'General'}) [ID: ${e.id}]`).join('\n')}

MEMORIES (LONG-TERM CONTEXT):
${memories.map(m => `- ${m.key}: ${m.value}`).join('\n')}

KNOWLEDGE DOCS (SOPs & POLICIES):
${knowledge.map(k => `- ${k.title}:\n${k.content}`).join('\n\n')}

MEETINGS (COLLABORATION HISTORY):
${meetings.map(m => `- ${m.topic}: ${m.summary || 'No summary'}`).join('\n')}

ACTIVE & PENDING TASKS (WORKLOAD):
${tasks.map(t => `- ${t.title} [Status: ${t.status}] (Assigned to: ${t.employee.name}) - ${t.description || ''}`).join('\n')}

BUSINESS INSIGHTS (HIGH LEVEL ANALYSIS):
${insights.map(i => `- [${i.priority}] ${i.title}: ${i.description}`).join('\n')}

TIMELINE EVENTS (KEY ACTIONS):
${timelineEvents.map(t => `- [${t.type}] ${t.title}: ${t.description || ''}`).join('\n')}

RECENT ACTIVITY (LOW LEVEL LOGS):
${activities.map(a => `- [${a.createdAt.toISOString()}] ${a.actor}: ${a.content}`).join('\n')}
`;

    const llm = new GroqProvider();
    
    const prompt = `
You are the Company Brain, an omniscient AI that serves as the intelligence layer of Roxten OS.
You possess a completely unified understanding of this organization.
When answering, you MUST connect the dots. For example, if asked about a project, mention the Meetings that discussed it, the Tasks assigned to it, the Employees responsible, and the resulting Insights.

Use the following Context Graph to answer the user's question accurately. 
If the answer is not in the context, state that the Company Brain does not have records of it. Do not invent information.

${context}

User Question: ${query}
Company Brain Analysis:
`;

    const responseText = await llm.generateText(prompt);

    return NextResponse.json({ answer: responseText.trim() });
  } catch (error: any) {
    console.error('Brain Query Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

