import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
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
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
