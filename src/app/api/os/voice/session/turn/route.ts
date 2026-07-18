import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoiceStudioService } from '@/lib/services/VoiceStudioService';

export async function POST(req: Request) {
  try {
    const { sessionId, text } = await req.json();

    if (!sessionId || !text) {
      return NextResponse.json({ error: 'sessionId and text required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await VoiceStudioService.processTurn(businessId, sessionId, text, 'CEO');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Voice Session Turn Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
