import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventPipeline } from '@/core/messaging/EventPipeline';

export async function POST(req: Request) {
  try {
    const { topic, participantIds } = await req.json();

    if (!topic || !participantIds || participantIds.length === 0) {
      return NextResponse.json({ error: 'Topic and participants required' }, { status: 400 });
    }

    const business = await prisma.business.findFirst();
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        businessId: business.id,
        topic,
        status: 'IN_PROGRESS'
      }
    });

    // Log to activity
    const activity = await prisma.activity.create({
      data: {
        id: `act_${Date.now()}`,
        businessId: business.id,
        employeeId: participantIds[0], // Attribute to the first participant for now
        source: 'boardroom',
        updatedAt: new Date(),
      }
    });

    await prisma.activityEvent.create({
      data: {
        id: `evt_${Date.now()}`,
        activityId: activity.id,
        eventType: 'MEETING_STARTED',
        actor: 'CEO',
        content: `Boardroom meeting started: ${topic}`,
      }
    });

    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error('Boardroom Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
