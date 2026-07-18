import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employeesRaw = await prisma.employee.findMany({
      include: {
        department: true
      }
    });

    // Sort in memory to avoid missing Firestore composite index error
    const employees = employeesRaw.sort((a: any, b: any) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
