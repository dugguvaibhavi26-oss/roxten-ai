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

    const reports = await prisma.businessReport.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const { timeframe } = await req.json();
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    const userId = cookieStore.get('userId')?.value || 'System';

    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const { ReportService } = await import('@/lib/services/ReportService');
    const report = await ReportService.generateReport(business.id, timeframe || 'WEEKLY', userId);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
