import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventPipeline } from '@/core/messaging/EventPipeline';
import { IntelligenceService } from '@/lib/services/IntelligenceService';
import { EventService } from '@/lib/services/EventService';

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

    // 2. Initial Employee Record Creation (Pending Deployment)
    const employee = await prisma.employee.create({
      data: {
        name: template.name,
        role: template.role,
        personality: template.personality,
        responsibilities: template.responsibilities,
        goals: template.goals,
        communicationStyle: template.communicationStyle,
        decisionBoundaries: template.decisionBoundaries,
        kpis: template.kpis,
        departmentKnowledge: template.departmentKnowledge,
        runtimeConfig: template.runtimeConfig,
        businessId: businessId,
        departmentId: department.id,
        isActive: false, // Explicitly false until verified
        isDeployed: false, // Explicitly false until verified
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

    // 3. Inject Memory, DNA, Knowledge, Responsibilities, Goals, Boundaries
    const memoriesToInject = [
      { key: 'Role Definition', value: template.role },
      { key: 'Responsibilities', value: Array.isArray(template.responsibilities) ? template.responsibilities.join(', ') : template.responsibilities || 'General duties' },
      { key: 'Goals', value: Array.isArray(template.goals) ? template.goals.join(', ') : template.goals || 'Serve the company' },
      { key: 'Decision Boundaries', value: template.decisionBoundaries || 'Follow standard protocol' },
      { key: 'Department Knowledge', value: template.departmentKnowledge || 'No specific knowledge provided' },
      { key: 'Personality', value: template.personality || 'Professional' },
      { key: 'Communication Style', value: template.communicationStyle || 'Direct' }
    ];

    // Bulk inject into Prisma (SQL/Relational mock)
    await prisma.memory.createMany({
      data: memoriesToInject.map(m => ({
        businessId,
        employeeId: employee.id,
        type: 'core_directive',
        key: m.key,
        value: m.value,
        status: 'ACTIVE',
        updatedAt: new Date()
      }))
    });

    // Bulk inject into IntelligenceService (Firebase/Vector mock)
    try {
      for (const m of memoriesToInject) {
        await IntelligenceService.addEmployeeMemory(businessId, employee.id, `Core Directive: ${m.key}`, m.value);
      }
    } catch (e) {
      console.error('Failed to add initial memories to Firebase', e);
      throw new Error("Intelligence Service Failure - Deployment Aborted");
    }

    // 4. Runtime Validation & Deployment Marking
    // At this point: Employee Exists, Department Exists, Memory Loaded, Voice Ready.
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        isActive: true,
        isDeployed: true
      }
    });

    employee.isActive = true;
    employee.isDeployed = true;

    // 5. Timeline Generation (Ripple Effect)
    await EventService.publish({
      businessId: businessId,
      eventType: 'EMPLOYEE_HIRED',
      module: 'WORKFORCE',
      title: 'New AI Employee Deployed',
      description: `${employee.name} initialized and deployed as ${employee.role} in ${department.name}.`,
      actor: 'CEO',
      targetEntity: 'Employee',
      relatedEmployeeId: employee.id,
      departmentId: department.id,
      metadata: { role: employee.role },
      severity: 'SUCCESS'
    });

    // EventPipeline Broadcast
    const pipeline = EventPipeline.getInstance();
    
    // Broadcast for UI updates
    pipeline.dispatch({
      type: 'WORKFORCE_UPDATED',
      sender: 'system',
      receiver: '*',
      intent: 'STATE_UPDATE',
      payload: { employeeId: employee.id, action: 'DEPLOYED' },
      priority: 'high',
      status: 'completed'
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error deploying agent:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
