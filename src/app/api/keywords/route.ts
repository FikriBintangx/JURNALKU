import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Berikan 8-10 kata kunci akademik terbaik dari jurnal ini untuk optimasi pencarian.

Sertakan:
1. **Kata kunci dalam Bahasa Indonesia** (5-6 kata kunci)
2. **Kata kunci dalam Bahasa Inggris** (5-6 kata kunci)
3. **Kata kunci untuk database Scopus/WoS** (3-4 kata kunci spesifik)

Format jawaban:
## Kata Kunci Bahasa Indonesia
- kata kunci 1
- kata kunci 2
...

## Keywords (English)
- keyword 1
- keyword 2
...

## Scopus/WoS Specific
- specific term 1
...`;

    const result = await geminiService.generateAI({ paperId, type: 'keywords', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[KEYWORDS]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan keywords tidak tersedia.", data: null });
  }
}
