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

    const prompt = `Identifikasi dan prediksi research gap (celah penelitian) dari jurnal ini.

Analisis harus mencakup:
1. **Keterbatasan penelitian saat ini** — apa yang belum diteliti
2. **Variabel yang terabaikan** — faktor yang bisa mempengaruhi hasil namun tidak diteliti
3. **Peluang penelitian baru** — topik spesifik yang bisa dikembangkan
4. **Ide skripsi/tesis** — minimal 3 judul penelitian yang relevan
5. **Future direction** — arah penelitian jangka panjang

Gunakan Bahasa Indonesia akademik dan format markdown yang jelas.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'gap-prediction',
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
    console.error("[GAP-PREDICTION] Unexpected error:", error.message);
    return NextResponse.json({
      success: false, fallback: true, error: true,
      message: "Layanan gap prediction sementara tidak tersedia.",
      data: null,
    });
  }
}
