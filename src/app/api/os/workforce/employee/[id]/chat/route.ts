import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeRuntime } from '@/core/runtime/EmployeeRuntime';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { message, history } = await req.json();

    // Initialize Providers
    const llm = new GroqProvider();
    
    // Special Case: JARVIS System Intelligence
    if (id === 'jarvis') {
      const runtime = new EmployeeRuntime({
        id: 'jarvis',
        businessId: 'system',
        name: 'JARVIS',
        role: 'System Intelligence',
        department: 'Operations',
        personality: 'Highly professional, formal, intelligent, concise, deferential to the CEO.',
        rules: [],
        knowledgeTags: [],
        voiceId: 'jarvis',
        speakingStyle: 'natural, professional, and crisp',
        mood: 'neutral',
        temperature: 0.6,
        context: 'You are the core operating system intelligence. The CEO has requested a briefing or given a command.'
      }, llm, null as any);
      const { text: responseText, handoverTo } = await runtime.processMessage(message, history || []);
      
      let handoverEmployee: any = null;
      if (handoverTo) {
        const targetDept = await prisma.department.findFirst({
          where: { name: { contains: handoverTo, mode: 'insensitive' }, businessId: 'system' }, // fallback
          include: { employees: true }
        });
        if (targetDept && targetDept.employees.length > 0) {
          handoverEmployee = {
            id: targetDept.employees[0].id,
            name: targetDept.employees[0].name,
            role: targetDept.employees[0].role
          };
        }
      }
      
      return NextResponse.json({ text: responseText, voiceId: 'jarvis', handoverEmployee });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Spin up the runtime
    const runtime = new EmployeeRuntime({
      id: employee.id,
      businessId: employee.businessId,
      name: employee.name,
      role: employee.role,
      department: employee.department?.name || 'General',
      personality: employee.personality || 'Professional',
      rules: employee.permissions || [],
      knowledgeTags: employee.knowledgeAccessTags || [],
      voiceId: employee.voiceId || employee.selectedVoiceId || 'default',
      speakingStyle: employee.speakingStyle || 'natural and concise',
      mood: employee.mood || 'neutral',
      temperature: employee.temperature || 0.7,
      context: employee.context || ''
    }, llm, null as any);

    // Load active memory
    const memoryBank = employee.memories.map(m => ({ key: m.key, value: m.value }));
    await runtime.initializeMemory(memoryBank);

    // Process Message
    const { text: responseText, handoverTo } = await runtime.processMessage(message, history || []);
    
    let handoverEmployee: any = null;
    if (handoverTo) {
      const targetDept = await prisma.department.findFirst({
        where: { name: { contains: handoverTo, mode: 'insensitive' }, businessId: employee.businessId },
        include: { employees: true }
      });
      if (targetDept && targetDept.employees.length > 0) {
        handoverEmployee = {
          id: targetDept.employees[0].id,
          name: targetDept.employees[0].name,
          role: targetDept.employees[0].role
        };
      }
    }

    // Persist conversation history to Firebase
    try {
      const { adminDb } = await import('@/lib/firebase-admin');
      await adminDb.collection('conversationHistory').add({
        employeeId: id,
        businessId: employee.businessId,
        message,
        response: responseText,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to persist conversation history', e);
    }

    return NextResponse.json({ 
      text: responseText,
      voiceId: employee.selectedVoiceId,
      handoverEmployee
    });

  } catch (error: any) {
    console.error('Chat Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
