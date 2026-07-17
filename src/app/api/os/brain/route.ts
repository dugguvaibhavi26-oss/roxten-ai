import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const [memories, knowledge, meetings, tasks, insights, timelineEvents] = await Promise.all([
      prisma.memory.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.businessKnowledge.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.meeting.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.task.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { employee: true }
      }),
      prisma.businessInsight.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.businessTimelineEvent.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    return NextResponse.json({
      metrics: {
        totalMemories: memories.length,
        knowledgeNodes: knowledge.length,
        recentActivities: timelineEvents.length,
        activeTasks: tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
        insights: insights.length,
        timelineEvents: timelineEvents.length
      },
      business,
      memories,
      knowledge,
      meetings,
      tasks,
      insights,
      timelineEvents
    });
  } catch (error: any) {
    console.error('Error fetching brain data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
