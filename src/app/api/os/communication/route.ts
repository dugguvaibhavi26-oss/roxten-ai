import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CommunicationService } from '@/lib/services/CommunicationService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const rawActivities = await prisma.activity.findMany({
      where: { businessId: business.id, source: 'communication' }
    });

    const activities = await Promise.all(rawActivities.map(async (act: any) => {
      const events = await prisma.activityEvent.findMany({
        where: { activityId: act.id }
      });
      return {
        ...act,
        ActivityEvent: (events || []).sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      };
    }));

    activities.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

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

    let actId = activityId;

    // Create activity (thread) if it doesn't exist
    if (!actId) {
      actId = await CommunicationService.createThread(businessId, targetEmployeeId || 'general', actor || 'CEO');
    }

    // Save the incoming message
    await CommunicationService.sendMessage(businessId, actId, actor || 'CEO', message, 'DELIVERED');

    // If targetEmployeeId is provided and it's not a general broadcast, generate an AI response
    if (targetEmployeeId && targetEmployeeId !== 'general') {
      const aiEvent = await CommunicationService.generateAiReply(businessId, actId, targetEmployeeId);
      return NextResponse.json({ activityId: actId, event: aiEvent });
    }

    return NextResponse.json({ activityId: actId });
  } catch (error: any) {
    console.error('Communication POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { activityId } = await req.json();
    if (!activityId) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });
    
    await CommunicationService.markThreadAsRead(activityId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Communication PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

