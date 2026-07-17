import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeRuntime } from '@/core/runtime/EmployeeRuntime';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { meetingId, speakerId, ceoMessage } = await req.json();

    if (!meetingId || !speakerId) {
      return NextResponse.json({ error: 'Missing meetingId or speakerId' }, { status: 400 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { transcripts: { orderBy: { createdAt: 'asc' } } }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // If the CEO is speaking, we just save their message and return
    if (speakerId === 'ceo' && ceoMessage) {
      const transcript = await prisma.meetingTranscript.create({
        data: {
          meetingId,
          speaker: 'CEO',
          content: ceoMessage
        }
      });
      return NextResponse.json({ text: ceoMessage, speaker: 'CEO' });
    }

    // Otherwise, generate AI response
    const employee = await prisma.employee.findUnique({
      where: { id: speakerId },
      include: { department: true, memories: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Format transcript history
    const transcriptHistory = meeting.transcripts.map(t => `${t.speaker}: ${t.content}`).join('\n');
    
    // Initialize Runtime
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
      null as any // Voice not needed for text generation here
    );

    // Initialize Memory
    if (employee.memories && employee.memories.length > 0) {
      await runtime.initializeMemory(employee.memories.map(m => ({ key: m.key, value: m.value })));
    }

    // Build the prompt for the meeting turn
    const boardroomContext = `
[BOARDROOM MEETING CONTEXT]
Meeting Topic: "${meeting.topic}"

Transcript So Far:
${transcriptHistory}

IMPORTANT INSTRUCTIONS FOR THIS RESPONSE:
- You are speaking in the boardroom in front of the CEO and other executives.
- Act completely in character based on your department. If you are Finance, aggressively protect the budget. If you are Marketing, push for growth. If you are Engineering, raise technical realities and risks.
- GENUINELY DISAGREE with other executives if their plans violate your department's core responsibilities.
- Do not be generic. Be a real executive.
- Keep your response concise (1-3 sentences max).

What is your next spoken contribution?`;

    const { text: responseText, handoverTo } = await runtime.processMessage(boardroomContext);

    // Save to DB
    const transcript = await prisma.meetingTranscript.create({
      data: {
        meetingId,
        speaker: employee.name,
        content: responseText.trim()
      }
    });

    return NextResponse.json({ text: responseText.trim(), speaker: employee.name, id: transcript.id, handoverTo });
  } catch (error: any) {
    console.error('Boardroom Turn Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
