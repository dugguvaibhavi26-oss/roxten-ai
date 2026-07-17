import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const business = await prisma.business.findFirst();
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    return NextResponse.json({ success: true, data: business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const business = await prisma.business.findFirst();
    
    if (business) {
      const updated = await prisma.business.update({
        where: { id: business.id },
        data: payload
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      const created = await prisma.business.create({
        data: payload
      });
      return NextResponse.json({ success: true, data: created });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
