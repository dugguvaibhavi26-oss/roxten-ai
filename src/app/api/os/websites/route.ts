import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { templateId, templateName, templateType, dashboardConfig } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const websiteId = `web_${uuidv4()}`;

    // 1. Create Website Record
    const website = await prisma.website.create({
      data: {
        id: websiteId,
        businessId,
        templateId,
        name: `${templateName} Project`,
        type: templateType,
        status: 'DRAFT',
        domain: `draft-${websiteId.substring(0, 8)}.roxten.app`,
        metadata: {
          dashboard: dashboardConfig,
          analyticsInitialized: true,
          aiEnabled: true,
          createdAt: new Date().toISOString()
        },
        theme: {
          colors: {
            primary: '#4f46e5',
            secondary: '#111827'
          },
          typography: {
            heading: 'Inter',
            body: 'System UI'
          }
        }
      }
    });

    // 2. Initialize WebsiteSections
    const defaultSections = [
      { name: 'Header', type: 'header' },
      { name: 'Hero Banner', type: 'hero' },
      { name: 'Features Grid', type: 'features' },
      { name: 'Services', type: 'services' },
      { name: 'Testimonials', type: 'testimonials' },
      { name: 'Footer', type: 'footer' }
    ];

    for (let i = 0; i < defaultSections.length; i++) {
      const section = defaultSections[i];
      await prisma.websiteSection.create({
        data: {
          id: `sec_${uuidv4()}`,
          websiteId: websiteId,
          name: section.name,
          type: section.type,
          orderIndex: i,
          content: {}
        }
      });
    }

    return NextResponse.json({ success: true, websiteId });
  } catch (error: any) {
    console.error('Create Website Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const websites = await prisma.website.findMany({
      where: { businessId }
    });

    return NextResponse.json(websites);
  } catch (error: any) {
    console.error('Get Websites Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
