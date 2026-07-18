import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');
    
    if (!websiteId) return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const website = await prisma.website.findFirst({
      where: { id: websiteId, businessId }
    });

    if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

    const sections = await prisma.websiteSection.findMany({
      where: { websiteId }
    });

    sections.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return NextResponse.json({ website, sections });
  } catch (error: any) {
    console.error('Editor API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { websiteId, theme, sections } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate ownership
    const website = await prisma.website.findFirst({
      where: { id: websiteId, businessId }
    });

    if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

    // Update website theme
    if (theme) {
      await prisma.website.update({
        where: { id: websiteId },
        data: { theme }
      });
    }

    // Update sections
    if (sections && Array.isArray(sections)) {
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (sec.id) {
          await prisma.websiteSection.update({
            where: { id: sec.id },
            data: { orderIndex: i }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Editor API Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
