import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/services/arai/documentProcessor';

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

    // Use the new REAL autonomous ingestion pipeline
    const processed = await documentProcessor.process(buffer, file.name, userId);

    return NextResponse.json({ 
      success: true, 
      document: {
        id: processed.doi || file.name,
        title: processed.title,
        methodology: processed.methodology,
        variables: processed.variables,
        gap: processed.researchGap
      },
      message: 'Dokumen berhasil diserap dan dianalisis secara otonom.' 
    });

  } catch (error: any) {
    console.error('[API_WORKSPACE] Upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 });
  }
}
