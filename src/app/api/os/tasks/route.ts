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

    const tasks = await prisma.task.findMany({
      where: { businessId: business.id },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status, approvalStatus } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: status !== undefined ? status : undefined,
        approvalStatus: approvalStatus !== undefined ? approvalStatus : undefined,
      },
      include: { employee: true }
    });

    if (status) {
      await prisma.businessTimelineEvent.create({
        data: {
          businessId: task.businessId,
          type: 'TASK_EVENT',
          title: `Task ${status}: ${task.title}`,
          description: `Task was marked as ${status} by the CEO/System.`,
          createdAt: new Date()
        }
      }).catch(() => {});

      if (task.employeeId) {
        // Find or create an activity for this task
        let activity = await prisma.activity.findFirst({
          where: { businessId: task.businessId, employeeId: task.employeeId, source: 'task_event' }
        });

        if (!activity) {
          activity = await prisma.activity.create({
            data: {
              id: `act_task_${Date.now()}`,
              businessId: task.businessId,
              employeeId: task.employeeId,
              source: 'task_event',
              status: 'active',
              updatedAt: new Date()
            }
          });
        }

        await prisma.activityEvent.create({
          data: {
            id: `evt_t_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
            activityId: activity.id,
            eventType: 'TASK_UPDATE',
            actor: 'System',
            content: `Task "${task.title}" status changed to ${status}.`
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
