import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title, model } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const { audience = 'Mahasiswa' } = body;
    const prompt = `ADAPTIVE ACADEMIC EXPLAINER:
Jelaskan konsep inti penelitian ini untuk audiens: ${audience.toUpperCase()}.

Struktur Penjelasan:
1. Intisari Penelitian (Apa yang sebenarnya sedang dipecahkan?)
2. Metodologi Sederhana (Bagaimana langkah-langkahnya dalam bahasa awam?)
3. Dampak Nyata (Mengapa temuan ini penting bagi audiens ${audience}?)
4. Analogi Kontekstual (Bandingkan dengan situasi sehari-hari yang relevan)

JAWAB DALAM BAHASA INDONESIA YANG DISESUAIKAN DENGAN TARGET AUDIENS. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan bagian.`;

    const result = await geminiService.generateAI({ paperId, type: 'explainer', prompt, abstract, title, model });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[EXPLAINER]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan explainer tidak tersedia.", data: null });
  }
}
