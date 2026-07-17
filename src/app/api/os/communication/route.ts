import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeRuntime } from '@/core/runtime/EmployeeRuntime';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const activities = await prisma.activity.findMany({
      where: { businessId: business.id, source: 'communication' },
      include: {
        ActivityEvent: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Communication GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { activityId, targetEmployeeId, message, actor } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    let actId = activityId;

    // Create activity if it doesn't exist
    if (!actId) {
      const newAct = await prisma.activity.create({
        data: {
          id: `act_comm_${Date.now()}`,
          businessId: business.id,
          employeeId: targetEmployeeId || 'general',
          source: 'communication',
          status: 'active',
          updatedAt: new Date()
        }
      });
      actId = newAct.id;
    }

    // Save the incoming message
    await prisma.activityEvent.create({
      data: {
        id: `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
        activityId: actId,
        eventType: 'MESSAGE',
        actor: actor || 'CEO',
        content: message
      }
    });

    // If targetEmployeeId is provided, generate an AI response
    if (targetEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: targetEmployeeId },
        include: { department: true }
      });

      if (employee) {
        // Fetch history
        const activity = await prisma.activity.findUnique({
          where: { id: actId },
          include: { ActivityEvent: { orderBy: { createdAt: 'asc' } } }
        });

        const history = activity?.ActivityEvent.map(e => `${e.actor}: ${e.content}`).join('\n') || '';

        const llm = new GroqProvider();
        const runtime = new EmployeeRuntime(
          {
            id: employee.id,
            businessId: employee.businessId,
            name: employee.name,
            role: employee.role,
            department: employee.department?.name || 'General',
            personality: employee.personality || 'Professional',
            rules: [],
            knowledgeTags: employee.knowledgeAccessTags || [],
            voiceId: employee.selectedVoiceId || 'default'
          },
          llm,
          null as any
        );

        const prompt = `
You are participating in an internal company communication thread.
Thread History:
${history}

Reply to the latest message. Keep it concise, natural, and in character as the ${employee.role}.
`;

        const responseText = await llm.generateText(prompt);

        const aiEvent = await prisma.activityEvent.create({
          data: {
            id: `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
            activityId: actId,
            eventType: 'MESSAGE',
            actor: employee.name,
            content: responseText.trim()
          }
        });

        return NextResponse.json({ activityId: actId, event: aiEvent });
      }
    }

    return NextResponse.json({ activityId: actId });
  } catch (error: any) {
    console.error('Communication POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
