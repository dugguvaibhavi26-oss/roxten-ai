import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventPipeline } from '@/core/messaging/EventPipeline';
import { IntelligenceService } from '@/lib/services/IntelligenceService';
import { EventService } from '@/lib/services/EventService';

export async function POST(req: Request) {
  try {
    const { templateId, businessId, customConfig } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    // 1. Department Resolution
    let departmentName = customConfig?.department || 'General';
    let department = await prisma.department.findFirst({
      where: { businessId, name: departmentName }
    });
    if (!department) {
      department = await prisma.department.create({
        data: { businessId, name: departmentName, description: `Department for ${departmentName}` }
      });
    }

    // Use custom voice or fallback
    const voiceId = customConfig?.voiceId || 'kokoro-af_bella';
    const isMale = voiceId.includes('am_');

    const empName = customConfig?.name || `Agent-${Math.floor(Math.random() * 1000)}`;
    const empRole = customConfig?.role || 'Custom Agent';
    const empPersonality = customConfig?.personality || 'Professional';
    
    // 2. Initial Employee Record Creation
    const employee = await prisma.employee.create({
      data: {
        name: empName,
        role: empRole,
        personality: empPersonality,
        responsibilities: customConfig?.responsibilities || ['General duties'],
        goals: customConfig?.goals || [],
        communicationStyle: customConfig?.communicationStyle || 'Direct',
        decisionBoundaries: customConfig?.decisionBoundaries || 'Semi Autonomous',
        kpis: customConfig?.kpis || [],
        departmentKnowledge: 'Trained on ' + (customConfig?.knowledgeDocs || 0) + ' docs.',
        runtimeConfig: { 
          formality: customConfig?.formality || 50,
          empathy: customConfig?.empathy || 50,
          confidence: customConfig?.confidenceLevel || 50,
          humor: customConfig?.humorLevel || 50,
          autonomyLevel: customConfig?.decisionBoundaries || 'Semi Autonomous',
          rules: customConfig?.rulesGeneral || [],
          permissions: customConfig?.permissions || { can: [], cannot: [] }
        },
        businessId: businessId,
        departmentId: department.id,
        isActive: true, // Deploying immediately in wizard
        isDeployed: true, 
        selectedVoiceId: voiceId,
        voiceId: voiceId,
        voiceProvider: 'Kokoro',
        gender: isMale ? 'Male' : 'Female',
        accent: 'American',
        speakingStyle: customConfig?.communicationStyle || 'Direct',
        mood: empPersonality,
        temperature: 0.5
      }
    });

    // 3. Inject Memory, DNA, Knowledge, Responsibilities, Goals, Boundaries
    const memoriesToInject = [
      { key: 'Role Definition', value: empRole },
      { key: 'Responsibilities', value: (customConfig?.responsibilities || []).join(', ') },
      { key: 'Goals', value: (customConfig?.goals || []).join(', ') },
      { key: 'Decision Boundaries', value: customConfig?.decisionBoundaries || 'Semi Autonomous' },
      { key: 'Personality', value: empPersonality },
      { key: 'Mandatory Rules', value: (customConfig?.rulesGeneral || []).join(', ') }
    ];

    await prisma.memory.createMany({
      data: memoriesToInject.map(m => ({
        businessId, employeeId: employee.id, type: 'core_directive', key: m.key, value: m.value, status: 'ACTIVE', updatedAt: new Date()
      }))
    });

    try {
      for (const m of memoriesToInject) {
        await IntelligenceService.addEmployeeMemory(businessId, employee.id, `Core Directive: ${m.key}`, m.value);
      }
    } catch (e) {
      console.error('Failed to add initial memories to Firebase', e);
    }

    // 5. Timeline Generation (Ripple Effect)
    await EventService.publish({
      businessId: businessId,
      eventType: 'EMPLOYEE_HIRED',
      module: 'WORKFORCE',
      title: 'New AI Employee Deployed',
      description: `${employee.name} deployed as ${employee.role} in ${department.name}. Rules injected.`,
      actor: 'CEO',
      targetEntity: 'Employee',
      relatedEmployeeId: employee.id,
      departmentId: department.id,
      metadata: { role: employee.role },
      severity: 'SUCCESS'
    });

    const pipeline = EventPipeline.getInstance();
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
