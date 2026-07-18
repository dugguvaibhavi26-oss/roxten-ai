import { NextResponse } from 'next/server';

// @deprecated Use /api/os/knowledge/ingest instead. This route will be removed in Phase 2.
// Existing usage in /onboarding/existing-business/page.tsx needs to be migrated.

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadPath = formData.get('path') as string;

    if (!file || !uploadPath) {
      return NextResponse.json({ error: 'File and path are required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use Firebase Storage REST API directly to bypass both CORS and SDK issues
    const bucket = 'roxten-os.firebasestorage.app';
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(uploadPath)}`;
    
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: buffer
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Firebase REST Upload Error:', errorText);
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    // Construct public download URL
    const downloadTokens = data.downloadTokens;
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(uploadPath)}?alt=media&token=${downloadTokens}`;

    // Extract text from the file for knowledge base processing
    let extractedText = '';
    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else {
        // Fallback for text files
        extractedText = buffer.toString('utf-8');
      }
    } catch (parseError) {
      console.warn('Could not parse file text:', parseError);
    }

    return NextResponse.json({ url, text: extractedText });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
