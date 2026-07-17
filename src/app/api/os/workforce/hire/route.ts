import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventPipeline } from '@/core/messaging/EventPipeline';

export async function POST(req: Request) {
  try {
    const { templateId, businessId } = await req.json();

    if (!templateId || !businessId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const template = await prisma.employeeTemplate.findUnique({
      where: { id: templateId },
      include: { TemplateVoiceRecommendation: true }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 1. Department Resolution
    let department = await prisma.department.findFirst({
      where: { businessId, name: template.department || 'General' }
    });
    if (!department) {
      department = await prisma.department.create({
        data: {
          businessId,
          name: template.department || 'General',
          description: `Department for ${template.department}`
        }
      });
    }

    const voiceRec = template.TemplateVoiceRecommendation;
    const voiceId = voiceRec?.voiceId || 'kokoro-af_bella';
    const isMale = voiceId.includes('am_');

    // 2. Employee Record Creation
    const employee = await prisma.employee.create({
      data: {
        name: template.name,
        role: template.role,
        personality: template.personality,
        responsibilities: template.responsibilities,
        goals: template.goals,
        businessId: businessId,
        departmentId: department.id,
        isActive: true,
        isDeployed: true,
        selectedVoiceId: voiceId,
        voiceId: voiceId,
        voiceProvider: voiceRec?.provider || 'Kokoro',
        gender: isMale ? 'Male' : 'Female',
        accent: 'American',
        speakingStyle: template.personality,
        mood: 'Professional',
        temperature: 0.5
      }
    });

    // 3. Memory Initialization
    await prisma.memory.createMany({
      data: [
        {
          businessId,
          employeeId: employee.id,
          type: 'core_directive',
          key: 'primary_goal',
          value: template.goals || 'Serve the company',
          status: 'ACTIVE',
          updatedAt: new Date()
        },
        {
          businessId,
          employeeId: employee.id,
          type: 'core_directive',
          key: 'personality',
          value: template.personality || 'Professional',
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      ]
    });

    // 4. Company Brain Registration & Activity Feed Update
    const activity = await prisma.activity.create({
      data: {
        id: `act_${Date.now()}`,
        businessId: businessId,
        employeeId: employee.id,
        status: 'system',
        updatedAt: new Date()
      }
    });

    await prisma.activityEvent.create({
      data: {
        id: `evt_${Date.now()}`,
        activityId: activity.id,
        eventType: 'AGENT_HIRED',
        actor: 'CEO',
        content: `Hired ${employee.name} (${employee.role}) into the ${department.name} department.`
      }
    });

    // 5. Timeline Generation (Ripple Effect)
    await prisma.businessTimelineEvent.create({
      data: {
        businessId: businessId,
        type: 'EMPLOYEE_EVENT',
        title: 'New AI Employee Hired',
        description: `${employee.name} joined as ${employee.role} in ${department.name}.`,
        metadata: { employeeId: employee.id, role: employee.role }
      }
    });

    // EventPipeline Broadcast
    const pipeline = EventPipeline.getInstance();
    
    // Broadcast for UI updates
    pipeline.dispatch({
      type: 'WORKFORCE_UPDATED',
      sender: 'system',
      receiver: '*',
      intent: 'STATE_UPDATE',
      payload: { employeeId: employee.id, action: 'HIRED' },
      priority: 'high',
      status: 'completed'
    });

    // Broadcast for persistence engines (Ripple Effect)
    pipeline.dispatch({
      type: 'AGENT_HIRED',
      sender: 'system',
      receiver: 'system',
      intent: 'LOG',
      payload: { employeeId: employee.id, action: 'HIRED' },
      priority: 'high',
      status: 'completed'
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error hiring agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
