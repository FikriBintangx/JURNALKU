import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title, model } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Buat ringkasan jurnal akademik ini dalam Bahasa Indonesia yang formal dan akademik.

Struktur ringkasan:

## Tujuan Penelitian
Apa masalah yang ingin dipecahkan? (2-3 kalimat)

## Metodologi
Pendekatan dan metode yang digunakan peneliti. (2-3 kalimat)

## Temuan Utama
Hasil atau kesimpulan terpenting dari penelitian ini. (3-4 kalimat)

## Kontribusi
Kontribusi penelitian ini terhadap ilmu pengetahuan. (1-2 kalimat)

## Implikasi Praktis
Bagaimana hasil penelitian bisa diterapkan di dunia nyata. (1-2 kalimat)

PENTING: Maksimal 250 kata total. Gunakan bahasa formal dan akademik.`;

    const result = await geminiService.generateAI({ paperId, type: 'summary', prompt, abstract, title, model });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[SUMMARY]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan ringkasan tidak tersedia.", data: null });
  }
}
