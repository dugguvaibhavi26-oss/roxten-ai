import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const integrations = await prisma.integration.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: integrations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
