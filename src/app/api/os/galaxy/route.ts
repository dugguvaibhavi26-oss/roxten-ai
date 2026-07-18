import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WorkforceService } from '@/lib/services/WorkforceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessGalaxy = await WorkforceService.getGalaxy(businessId);
    const pulseMetrics = await WorkforceService.getPulseMetrics(businessId);

    if (!businessGalaxy) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    return NextResponse.json({ ...businessGalaxy, pulseMetrics });
  } catch (error: any) {
    console.error('Error fetching galaxy data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
