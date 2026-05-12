import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const { paperId, abstract, title } = await request.json();
    const prompt = `SEMANTIC ACADEMIC ONTOLOGY TAGGER:
Identifikasi tag akademik yang paling relevan untuk kategorisasi metadata tingkat lanjut.

Ekstraksi tag berdasarkan:
1. Metodologi (misal: Quantitative, Case Study, SLR)
2. Teori Utama (misal: TAM, Resource-Based View)
3. Variabel Kunci
4. SDG Categories (Sustainable Development Goals)
5. Scopus Taxonomy (Bidang ilmu spesifik)
6. Research Domain

HASILKAN DALAM BAHASA INDONESIA FORMAL. JANGAN PERNAH MENGGUNAKAN SIMBOL HASHTAG (#) ATAU BINTANG (*). Gunakan baris baru untuk memisahkan setiap tag.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'tags',
      prompt,
      abstract,
      title
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
