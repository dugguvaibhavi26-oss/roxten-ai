import { NextResponse } from 'next/server';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;
    const uploaderId = (formData.get('uploaderId') as string) || 'System';
    const sourceTitle = (formData.get('sourceTitle') as string) || file?.name || 'Uploaded Document';

    if (!businessId || !file) {
      return NextResponse.json({ 
        success: false, 
        stage: 'validation', 
        error: 'Missing file or businessId',
        details: `businessId: ${!!businessId}, file: ${!!file}`
      }, { status: 400 });
    }

    const { EventService } = await import('@/lib/services/EventService');
    const { default: prisma } = await import('@/lib/prisma');

    // 1. Create the raw document record
    let docMeta;
    try {
      docMeta = await prisma.knowledgeDocument.create({
        data: {
          businessId,
          title: sourceTitle,
          sourceUrl: '', // Will update after upload
          status: 'UPLOADING',
          type: 'DOCUMENT',
          fileSize: file.size || 0,
          fileType: file.type || 'application/octet-stream',
          uploaderId
        }
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, stage: 'database', error: 'Failed to create document record', details: e.message }, { status: 500 });
    }

    // 2. Upload to Storage
    let url = '';
    let extractedText = '';
    try {
      const uploadPath = `companies/${businessId}/knowledge/${docMeta.id}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use Firebase Storage REST API directly to bypass both CORS and SDK issues
      const bucket = 'roxten-os.firebasestorage.app';
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(uploadPath)}`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: buffer
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      const downloadTokens = data.downloadTokens;
      url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(uploadPath)}?alt=media&token=${downloadTokens}`;

      // 3. Extract text
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        if (typeof global.DOMMatrix === 'undefined') {
          (global as any).DOMMatrix = class DOMMatrix {
            constructor() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
          };
        }
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse(new Uint8Array(buffer));
        const pdfData = await parser.getText();
        extractedText = pdfData.text;
      } else {
        extractedText = buffer.toString('utf-8');
      }
      
      if (!extractedText.trim()) {
         throw new Error('Extracted text is empty');
      }

    } catch (e: any) {
      // We log it but proceed to return structured error
      return NextResponse.json({ success: false, stage: 'extraction', error: 'Failed to upload or extract text', details: e.message }, { status: 500 });
    }

    // 4. Update Document and Timeline
    try {
      await prisma.knowledgeDocument.update({
        where: { id: docMeta.id },
        data: { sourceUrl: url }
      });
      await EventService.publish({
        businessId,
        module: 'KNOWLEDGE',
        eventType: 'DOCUMENT_UPLOADED',
        title: 'Document Uploaded',
        description: `Document uploaded: ${docMeta.title}`,
        actor: uploaderId,
        metadata: { documentId: docMeta.id }
      });
    } catch (e: any) {
       return NextResponse.json({ success: false, stage: 'timeline', error: 'Failed to update timeline or database', details: e.message }, { status: 500 });
    }

    // 5. Generate AI Summary (Company Brain)
    let result;
    try {
      result = await IntelligenceService.ingestKnowledge(businessId, docMeta.id, extractedText);
    } catch (e: any) {
      return NextResponse.json({ success: false, stage: 'ai_summary', error: 'Failed to generate AI summary', details: e.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, ingestedItems: result.ingestedItems, documentId: docMeta.id, url });
  } catch (error: any) {
    console.error('Knowledge Ingest Error:', error);
    return NextResponse.json({ success: false, stage: 'unknown', error: 'An unknown error occurred', details: error.message }, { status: 500 });
  }
}
