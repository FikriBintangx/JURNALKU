import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAIContent } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { abstract, title, paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json({ error: 'Paper ID diperlukan' }, { status: 400 });
    }

    // 1. Cek cache di database
    const cached = await prisma.summary.findFirst({
      where: { journalId: paperId, type: 'structured' }
    });

    if (cached && cached.json) {
      console.log('[CACHE] Using structured summary for:', paperId);
      return NextResponse.json({ ...cached.json as object, cached: true });
    }

    // 2. Jika tidak ada, generate
    const prompt = `Anda adalah asisten riset profesional. Ringkaslah abstrak jurnal berikut menjadi format JSON yang terstruktur dalam Bahasa Indonesia.
    
    Format JSON harus:
    {
      "summary": "Ringkasan satu paragraf yang padat (max 150 kata)",
      "keyPoints": ["Poin utama 1", "Poin utama 2", "Poin utama 3"],
      "methodology": "Penjelasan singkat metode yang digunakan",
      "conclusion": "Kesimpulan akhir"
    }

    Judul: ${title}
    Abstrak: ${abstract || 'Tidak tersedia. Prediksikan berdasarkan judul.'}`;

    const structuredData = await generateAIContent(prompt, true);

    // 3. Simpan ke database
    await prisma.journal.upsert({
      where: { id: paperId },
      update: {},
      create: {
        id: paperId,
        title: title || 'Untitled',
        author: 'Unknown',
        abstract: abstract,
      }
    });

    await prisma.summary.create({
      data: {
        journalId: paperId,
        content: structuredData.summary,
        type: 'structured',
        json: structuredData
      }
    });

    return NextResponse.json({ ...structuredData, cached: false });
  } catch (error: any) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ 
      error: 'Gagal memproses ringkasan.',
      details: error.message 
    }, { status: 500 });
  }
}
