import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { businessId, text, sourceUrl, sourceTitle } = await req.json();

    if (!businessId || !text) {
      return NextResponse.json({ error: 'Missing businessId or text content' }, { status: 400 });
    }

    const llm = new GroqProvider();
    const systemPrompt = `You are a visionary AI Operating System. A new document was just uploaded to the company's knowledge base.
Document Source: ${sourceTitle || sourceUrl}
Document Content:
${text.substring(0, 15000)}

Analyze this new information and generate structured knowledge updates.
Return ONLY valid JSON matching this schema:
{
  "knowledgeUpdates": [
    {
      "category": "Policy",
      "title": "Title",
      "content": "Detailed content",
      "tags": ["tag1"],
      "confidenceScore": 95,
      "relatedDepartments": ["Operations"]
    }
  ],
  "brainUpdates": [
    {
      "category": "Growth Opportunity",
      "title": "New opportunity discovered",
      "content": "Details"
    }
  ]
}`;

    const synthesisText = await llm.generateText(systemPrompt, { temperature: 0.7 });
    
    let parsedData;
    try {
      const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : synthesisText);
    } catch (e) {
      throw new Error("Failed to parse LLM JSON for knowledge ingest.");
    }

    // 1. Insert Knowledge Graph updates
    if (parsedData.knowledgeUpdates) {
      const kgPromises = parsedData.knowledgeUpdates.map((kg: any) => 
        addDoc(collection(db, 'knowledgeBase'), {
          businessId,
          title: kg.title,
          category: kg.category,
          content: kg.content,
          tags: kg.tags || [],
          confidenceScore: kg.confidenceScore || 90,
          sourceReference: sourceTitle || sourceUrl || 'Continuous Ingestion',
          relatedDepartments: kg.relatedDepartments || [],
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(kgPromises);
    }

    // 2. Insert Brain Updates
    if (parsedData.brainUpdates) {
      const brainPromises = parsedData.brainUpdates.map((brain: any) => 
        addDoc(collection(db, 'companyBrain'), {
          businessId,
          category: brain.category,
          content: brain.title,
          actionable: brain.content,
          impact: "Medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(brainPromises);
    }

    // 3. Update the Persistent Intelligence Report
    await addDoc(collection(db, 'reports'), {
      businessId,
      title: "Knowledge Ingestion Report",
      type: "update",
      content: `The system ingested ${sourceTitle} and extracted ${parsedData.knowledgeUpdates?.length || 0} new facts and ${parsedData.brainUpdates?.length || 0} insights.`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, ingestedItems: parsedData.knowledgeUpdates?.length || 0 });
  } catch (error: any) {
    console.error('Knowledge Ingest Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
