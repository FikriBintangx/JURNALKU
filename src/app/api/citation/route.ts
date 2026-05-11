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

    const prompt = `Buat format sitasi lengkap untuk jurnal akademik ini.

Sertakan format:

**APA 7th Edition:**
[Format APA yang benar berdasarkan data judul]

**MLA 9th Edition:**
[Format MLA yang benar]

**IEEE:**
[Format IEEE yang benar]

**Harvard:**
[Format Harvard yang benar]

**Chicago:**
[Format Chicago yang benar]

CATATAN PENTING:
- Gunakan data dari judul dan abstrak yang tersedia
- Tahun estimasi: ${currentYear} jika tidak diketahui
- Tandai data yang tidak tersedia dengan [tidak diketahui]
- Jangan mengarang data penulis`;

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
