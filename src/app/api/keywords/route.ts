import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title, model } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `OPTIMASI KATA KUNCI SEMANTIK:
Hasilkan 10 kata kunci akademik berimpak tinggi berdasarkan metodologi dan temuan paper ini.

Sertakan:
1. Kata kunci Bahasa Indonesia (Terpilih)
2. Keywords (English - International Standards)
3. Scopus Taxonomy & SDG Categories (Istilah spesifik indeksasi)

JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan kategori.`;

    const result = await geminiService.generateAI({ paperId, type: 'keywords', prompt, abstract, title, model });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[KEYWORDS]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan keywords tidak tersedia.", data: null });
  }
}
