import { NextRequest, NextResponse } from 'next/server';
import { vectorMemory } from '@/services/workspace/vectorMemory';

// Required for handling file uploads in Next.js App Router
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string || 'guest-workspace';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert Web File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[API_WORKSPACE] Received file: ${file.name} (${buffer.length} bytes)`);

    // Ingest into Vector Memory (PDF Parse -> Chunk -> Embed -> Save)
    const documentId = await vectorMemory.ingestDocument(userId, file.name, buffer, 'pdf');

    return NextResponse.json({ 
      success: true, 
      documentId, 
      message: 'PDF successfully ingested into Vector Memory' 
    });

  } catch (error: any) {
    console.error('[API_WORKSPACE] Upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
  }
}
