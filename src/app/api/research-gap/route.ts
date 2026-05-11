import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Analisis research gap dari jurnal akademik ini secara mendalam.

Berikan analisis yang mencakup:

## 1. Keterbatasan Penelitian Saat Ini
- Apa yang tidak diteliti atau dibatasi oleh peneliti?
- Keterbatasan metodologis

## 2. Variabel yang Belum Dieksplorasi
- Faktor moderasi/mediasi yang diabaikan
- Variabel kontekstual yang bisa mempengaruhi hasil

## 3. Peluang Penelitian Baru
- Topik spesifik yang bisa dikembangkan
- Pertanyaan penelitian baru yang muncul

## 4. Ide Skripsi / Tesis
Berikan minimal 3 judul penelitian yang bisa dikembangkan dari jurnal ini.

## 5. Arah Penelitian Masa Depan (Future Direction)
- Tren penelitian yang relevan
- Teknologi atau pendekatan baru yang bisa digunakan

Gunakan Bahasa Indonesia akademik yang formal dan jelas.`;

    const result = await geminiService.generateAI({ paperId, type: 'gap', prompt, abstract, title });

    return NextResponse.json({
      success: result.success, data: result.data,
      fallback: result.fallback || false, cached: result.cached || false,
    });

  } catch (error: any) {
    console.error("[RESEARCH-GAP]", error.message);
    return NextResponse.json({ success: false, fallback: true, error: true, message: "Layanan analisis gap tidak tersedia.", data: null });
  }
}
