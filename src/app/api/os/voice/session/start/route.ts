import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';

export async function POST(req: Request) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await VoiceStudioService.startSession(businessId, employeeId, 'CEO');

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Voice Session Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
