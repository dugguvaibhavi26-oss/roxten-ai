import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const [firebaseBrain, firebaseReports, knowledgeBase] = await Promise.all([
      IntelligenceService.getCompanyBrain(business.id),
      IntelligenceService.getReports(business.id),
      IntelligenceService.getKnowledgeBase(business.id)
    ]);
    
    // Map Firestore brain nodes to the expected response structure
    const insights = firebaseBrain.map(node => ({
      id: node.id,
      title: node.title || node.content || 'Insight',
      description: node.actionable || node.content || '',
      impact: node.impact || 'Medium',
      category: node.category || 'General',
      createdAt: node.createdAt
    }));
    
    // We can also fetch some relational tasks/timeline if we want, but for now we'll 
    // just pull a quick summary of tasks to not break the UI metrics
    const [tasks, timelineEvents, dna] = await Promise.all([
      prisma.task.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { employee: true }
      }),
      prisma.businessTimelineEvent.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      IntelligenceService.getCompanyDNA(business.id)
    ]);

    return NextResponse.json({
      metrics: {
        totalMemories: firebaseBrain.length,
        knowledgeNodes: firebaseBrain.length,
        recentActivities: timelineEvents.length,
        activeTasks: tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
        insights: insights.length,
        timelineEvents: timelineEvents.length
      },
      business,
      dna,
      memories: firebaseBrain, // Sending brain as memories for UI compat
      knowledge: knowledgeBase, // The brain page uses this
      meetings: firebaseReports.filter(r => r.type === 'meeting' || r.title.includes('Meeting')),
      tasks,
      insights,
      timelineEvents
    });
  } catch (error: any) {
    console.error('Error fetching brain data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
