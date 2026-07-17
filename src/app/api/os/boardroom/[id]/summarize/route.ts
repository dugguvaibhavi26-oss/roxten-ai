import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { EventPipeline } from '@/core/messaging/EventPipeline';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { transcripts: { orderBy: { createdAt: 'asc' } }, business: true }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const transcriptHistory = (meeting.transcripts || []).map((t: any) => `${t.speaker}: ${t.content}`).join('\n');
    
    const llm = new GroqProvider();
    
    const prompt = `
You are an executive assistant AI analyzing a boardroom meeting transcript.
Meeting Topic: ${meeting.topic}

Transcript:
${transcriptHistory}

Generate a concise executive summary of the meeting. 
Return ONLY valid JSON with the following structure:
{
  "summaryText": "Overall paragraph summary of the meeting.",
  "metaInsight": "A high-level pattern, strategy, or core organizational learning extracted from this meeting.",
  "decisions": [
    { "key": "decision_topic", "value": "What was decided" }
  ],
  "actionItems": [
    { "owner": "Name of the person/AI assigned (e.g., 'Brand Strategist' or 'CEO')", "title": "Task title", "description": "Task description" }
  ]
}
`;

    const summaryJSONStr = await llm.generateJSON<any>(prompt);

    // Save summary to meeting
    await prisma.meeting.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        summary: summaryJSONStr.summaryText
      }
    });

    // Add to Institutional Memory (Company Brain)
    if (summaryJSONStr.metaInsight) {
      await prisma.businessKnowledge.create({
        data: {
          businessId: meeting.businessId,
          title: `Executive Insight: ${meeting.topic}`,
          content: `${summaryJSONStr.summaryText}\n\nKey Learning: ${summaryJSONStr.metaInsight}`,
          keywords: ['meeting', 'insight', 'strategy', 'executive', meeting.topic.toLowerCase()],
          sourceType: 'MEETING_ANALYSIS'
        }
      });
      
      const pipeline = EventPipeline.getInstance();
      pipeline.dispatch({
        type: 'KNOWLEDGE_DISCOVERED',
        sender: 'system',
        receiver: 'all',
        intent: 'LEARNING',
        payload: { title: `Executive Insight: ${meeting.topic}` },
        priority: 'normal',
        status: 'completed'
      });
    }

    // Generate Tasks from Action Items
    if (summaryJSONStr.actionItems && summaryJSONStr.actionItems.length > 0) {
      const activeEmployees = await prisma.employee.findMany({
        where: { businessId: meeting.businessId, isActive: true },
        select: { id: true, name: true, role: true }
      });

      for (const item of summaryJSONStr.actionItems) {
        // Find best match for owner
        const matched = activeEmployees.find((e: any) => 
          e.name.toLowerCase().includes(item.owner.toLowerCase()) || 
          e.role.toLowerCase().includes(item.owner.toLowerCase())
        );

        if (matched) {
          await prisma.task.create({
            data: {
              businessId: meeting.businessId,
              employeeId: matched.id,
              title: item.title,
              description: `Generated from meeting: ${meeting.topic}\n\n${item.description}`,
              status: 'PENDING',
              priority: 'HIGH'
            }
          });
        }
      }
    }

    // Generate Timeline Event
    await prisma.businessTimelineEvent.create({
      data: {
        businessId: meeting.businessId,
        type: 'KNOWLEDGE_EVENT',
        title: 'Meeting Concluded',
        description: `Concluded meeting on "${meeting.topic}". Extracted ${summaryJSONStr.actionItems?.length || 0} action items.`,
        metadata: { meetingId: meeting.id }
      }
    });

    return NextResponse.json({ result: summaryJSONStr, businessId: meeting.businessId });
  } catch (error: any) {
    console.error('Boardroom Summarize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
