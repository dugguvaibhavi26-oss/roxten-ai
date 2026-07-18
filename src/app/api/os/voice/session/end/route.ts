import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await VoiceStudioService.endSession(businessId, sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Voice Session End Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
