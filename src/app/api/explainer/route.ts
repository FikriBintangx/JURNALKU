import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Jelaskan isi jurnal ini dengan bahasa yang sangat sederhana.
Bayangkan Anda menjelaskan kepada mahasiswa baru yang belum pernah membaca jurnal ilmiah.

Sertakan:
1. **Apa yang diteliti?** — masalah yang ingin dipecahkan
2. **Bagaimana caranya?** — metode dalam bahasa sehari-hari
3. **Apa hasilnya?** — temuan utama
4. **Kenapa penting?** — dampak nyata di kehidupan sehari-hari
5. **Analogi sederhana** — bandingkan dengan hal yang mudah dipahami

Gunakan kalimat pendek, aktif, dan mudah dipahami.`;

    const result = await geminiService.generateAI({ paperId, type: 'explainer', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[EXPLAINER]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan explainer tidak tersedia.", data: null });
  }
}
