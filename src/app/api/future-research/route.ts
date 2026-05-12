import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `FUTURE RESEARCH PREDICTION ENGINE:
Analisis trajektori penelitian berdasarkan jurnal ini dan literatur pendukung yang tersedia. 

Hasilkan minimal 5 ide penelitian masa depan yang konkret:
1. Prediksi Arah Riset (Tema yang akan muncul dalam 3-5 tahun)
2. Inovasi Metodologi (Metode baru yang direkomendasikan)
3. Pengembangan Teori (Celah teoritis yang perlu diisi)
4. Aplikasi Praktis & Industri (Implementasi nyata)
5. Kolaborasi Lintas Disiplin (Sinergi dengan bidang ilmu lain)

Gunakan Bahasa Indonesia akademik. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan setiap poin.`;

    const result = await geminiService.generateAI({ paperId, type: 'future-research', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[FUTURE-RESEARCH]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan ide penelitian tidak tersedia.", data: null });
  }
}
