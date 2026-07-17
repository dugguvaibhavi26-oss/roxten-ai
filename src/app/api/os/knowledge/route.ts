import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const knowledge = await prisma.businessKnowledge.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ success: true, data: knowledge });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
