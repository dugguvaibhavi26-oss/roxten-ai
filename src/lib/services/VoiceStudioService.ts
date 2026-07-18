import prisma from '@/lib/prisma';
import { CommunicationService } from './CommunicationService';
import { EventService } from './EventService';
import { ContextBuilder } from './ContextBuilder';
import { GroqProvider } from '@/core/providers/GroqProvider';

export class VoiceStudioService {
  
  /**
   * Starts a new Voice Session and binds it to a dedicated Communication thread.
   */
  static async startSession(businessId: string, employeeId: string, creatorId: string = 'CEO') {
    // 1. Create a specialized Communication Thread
    const threadId = await CommunicationService.createThread(businessId, employeeId, creatorId, 'VOICE_CALL');

    // 2. Create the Voice Session record
    const sessionId = `vs_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const session = await prisma.voiceSession.create({
      data: {
        id: sessionId,
        businessId,
        threadId,
        employeeId,
        sessionType: 'VOICE_TO_AI',
        status: 'ACTIVE',
        startedAt: new Date(),
        metadata: {}
      }
    });

    // 3. Log to Timeline
    await EventService.publish({
      businessId,
      module: 'VOICE',
      eventType: 'VOICE_STARTED',
      title: 'Voice Call Started',
      description: `A voice session was started with employee ${employeeId}.`,
      actor: creatorId,
      targetEntity: 'Employee',
      relatedEntityId: employeeId,
      metadata: { sessionId, threadId }
    });

    return session;
  }

  /**
   * Processes a single conversational turn in the voice session.
   * 1. Records STT input to Communication thread.
   * 2. Builds context & queries LLM.
   * 3. Records LLM output to Communication thread.
   * 4. Returns text for the frontend to pass to TTS.
   */
  static async processTurn(businessId: string, sessionId: string, text: string, actor: string = 'CEO') {
    const session = await prisma.voiceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Voice session not found');

    const threadId = session.threadId;

    // 1. Record user speech as a message in the thread
    await CommunicationService.sendMessage(businessId, threadId, actor, text, 'DELIVERED');

    // 2. Build Context
    const aiContext = await ContextBuilder.buildAIContext(businessId, session.employeeId);

    // 3. Fetch History for the prompt
    const activity = await prisma.activity.findUnique({
      where: { id: threadId }
    });
    
    // Safety check - shouldn't happen unless db is corrupted
    if (!activity) throw new Error('Underlying communication thread missing');
    
    const events = await prisma.activityEvent.findMany({
      where: { activityId: threadId },
      orderBy: { createdAt: 'asc' }
    });
    
    const history = events.map((e: any) => `${e.actor}: ${e.content}`).join('\n');

    // 4. Query LLM
    const llm = new GroqProvider();
    
    const employee = await prisma.employee.findUnique({ where: { id: session.employeeId } });
    const empName = employee?.name || 'AI Assistant';

    const prompt = `
${aiContext}

You are in a live voice conversation. Speak naturally, concisely, and in character.
Do not use emojis, markdown, or formatting that cannot be spoken aloud.
Use conversational filler words appropriately if it fits your character.

Conversation History:
${history}

Respond to the latest input.
`;

    const responseText = await llm.generateText(prompt);

    // 5. Record AI speech to the thread
    await CommunicationService.sendMessage(businessId, threadId, empName, responseText.trim(), 'DELIVERED');

    // Return the response for TTS synthesis
    return {
      text: responseText.trim(),
      employeeName: empName
    };
  }

  /**
   * Ends a voice session and logs it.
   */
  static async endSession(businessId: string, sessionId: string) {
    const session = await prisma.voiceSession.findUnique({ where: { id: sessionId } });
    if (!session) return;

    await prisma.voiceSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    await EventService.publish({
      businessId,
      module: 'VOICE',
      eventType: 'VOICE_ENDED',
      title: 'Voice Call Ended',
      description: `The voice session with employee ${session.employeeId} has ended.`,
      actor: 'System',
      targetEntity: 'Employee',
      relatedEntityId: session.employeeId,
      metadata: { sessionId }
    });

    return true;
  }
}
