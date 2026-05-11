import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Generate minimal 5 ide penelitian lanjutan yang konkret berdasarkan jurnal ini.

Untuk setiap ide, sertakan:
- **Judul yang disarankan** — judul penelitian yang spesifik
- **Latar belakang** — mengapa penelitian ini penting
- **Pendekatan** — metode yang direkomendasikan
- **Target publikasi** — jenis jurnal yang tepat

Format dengan markdown yang rapi dan mudah dibaca.

Sertakan juga:
- Ide aplikasi praktis di dunia industri
- Ide pengembangan teori
- Rekomendasi kolaborasi lintas disiplin`;

    const result = await geminiService.generateAI({ paperId, type: 'ideas', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[FUTURE-RESEARCH]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan ide penelitian tidak tersedia.", data: null });
  }
}
