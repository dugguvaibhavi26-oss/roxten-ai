import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const knowledge = await IntelligenceService.getKnowledgeBase(business.id);

    // Map to expected structure if needed, or just return as is
    const formattedKnowledge = knowledge.map(node => ({
      ...node,
      title: node.title || 'Knowledge Node',
      content: node.content || node.summary || '',
      keywords: node.tags || node.keywords || []
    }));

    return NextResponse.json({ success: true, data: formattedKnowledge });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
