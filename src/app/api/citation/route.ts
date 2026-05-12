import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const currentYear = new Date().getFullYear();

    const prompt = `AUTONOMOUS CITATION INTELLIGENCE:
Buat format sitasi ilmiah standar berdasarkan data paper ini.

Berikan format sitasi untuk:
1. APA 7th Edition
2. IEEE
3. Harvard
4. Vancouver
5. MLA 9th Edition

Sertakan juga:
- Validasi DOI (Jika tersedia)
- Kelengkapan Bibliografi (Status data penulis dan penerbit)

JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan setiap format.`;

    const result = await geminiService.generateAI({ paperId, type: 'citation', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[CITATION]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan sitasi tidak tersedia.", data: null });
  }
}
