import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, objective, channels, targetAudience, budget } = await req.json();
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const campaign = await prisma.marketingCampaign.create({
      data: {
        businessId: business.id,
        name,
        status: 'ACTIVE', // Switch to ACTIVE immediately for "alive" feel
        objectives: objective,
        audience: targetAudience,
        budget: budget ? budget.toString() : '0'
      }
    });

    // Auto-assign task to a marketing employee if one exists
    const marketingDept = await prisma.department.findFirst({ where: { businessId: business.id, name: 'Marketing' }});
    let assigneeId: string | null = null;
    if (marketingDept) {
      const marketer = await prisma.employee.findFirst({ where: { departmentId: marketingDept.id }});
      if (marketer) assigneeId = marketer.id;
    }
    if (!assigneeId) {
      const anyEmployee = await prisma.employee.findFirst({ where: { businessId: business.id } });
      if (anyEmployee) assigneeId = anyEmployee.id;
      else {
        // Fallback: Create a system agent if none exist
        const sysAgent = await prisma.employee.create({
           data: { businessId: business.id, name: 'System Agent', role: 'System', personality: 'Neutral', permissions: [] }
        });
        assigneeId = sysAgent.id;
      }
    }

    const task = await prisma.task.create({
      data: {
        businessId: business.id,
        employeeId: assigneeId,
        title: `Execute Campaign: ${name}`,
        description: `Target Audience: ${targetAudience}\nObjective: ${objective}\nBudget: $${budget}`,
        priority: 'HIGH',
        status: 'PENDING',
        requiresApproval: false,
        updatedAt: new Date()
      }
    });

    await prisma.businessTimelineEvent.create({
      data: {
        businessId: business.id,
        type: 'TASK_EVENT',
        title: `Campaign Launched: ${name}`,
        description: `Task assigned to Marketing.`,
        createdAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
