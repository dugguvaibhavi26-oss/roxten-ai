import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.employeeTemplate.findMany({
      include: {
        TemplateSkill: true
      }
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching marketplace templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
