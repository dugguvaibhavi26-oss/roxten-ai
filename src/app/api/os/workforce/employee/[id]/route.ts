import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch related activity events for this employee specifically
    const activities = await prisma.activityEvent.findMany({
      where: {
        Activity: {
          employeeId: employee.id
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Fetch knowledge based on employee's knowledgeAccessTags
    let knowledge: any[] = [];
    if (employee.knowledgeAccessTags && employee.knowledgeAccessTags.length > 0) {
      knowledge = await prisma.businessKnowledge.findMany({
        where: {
          businessId: employee.businessId,
          keywords: {
            hasSome: employee.knowledgeAccessTags
          }
        },
        take: 10
      });
    }

    return NextResponse.json({
      employee,
      activities,
      knowledge
    });
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await req.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        voiceId: data.voiceId,
        gender: data.gender,
        accent: data.accent,
        voiceSpeed: data.voiceSpeed,
        voicePitch: data.voicePitch,
        speakingStyle: data.speakingStyle,
        temperature: data.temperature,
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
