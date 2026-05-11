import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({
        success: false, fallback: true,
        message: "Paper ID diperlukan.",
        data: null,
      });
    }

    const prompt = `Buat roadmap penelitian (learning path) yang terstruktur berdasarkan topik jurnal ini.
Roadmap harus membantu mahasiswa memahami topik dari dasar hingga mahir.

Sertakan:
1. Prasyarat yang perlu dipahami
2. Tahapan belajar (fase demi fase)
3. Topik lanjutan yang direkomendasikan
4. Referensi jenis jurnal/buku yang relevan

Gunakan format markdown dengan heading dan bullet points yang jelas.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'roadmap',
      prompt,
      abstract,
      title,
    });

    return NextResponse.json({
      success: result.success,
      data: result.data,
      fallback: result.fallback || false,
      cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[ROADMAP] Unexpected error:", error.message);
    return NextResponse.json({
      success: false, fallback: true, error: true,
      message: "Layanan roadmap sementara tidak tersedia.",
      data: null,
    });
  }
}
