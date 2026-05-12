import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paperId, abstract, title, model } = body;

    if (!paperId) {
      return NextResponse.json({ success: false, fallback: true, message: "Paper ID diperlukan.", data: null });
    }

    const prompt = `Bertindaklah sebagai Senior Research Consultant. Buat ringkasan eksekutif dari jurnal akademik ini.

Struktur Output (Markdown):

### 🎯 Tujuan & Masalah
Identifikasi masalah utama yang melatarbelakangi penelitian ini dan tujuan spesifik yang ingin dicapai. (2-3 kalimat padat)

### 🔬 Metodologi & Pendekatan
Jelaskan desain penelitian, sampel, dan instrumen yang digunakan secara teknis namun mudah dipahami. (2-3 kalimat)

### 💡 Temuan Utama & Kesimpulan
Ringkas hasil terpenting dan apa makna dari temuan tersebut bagi bidang ilmu terkait. (3-4 kalimat)

### 🚀 Kontribusi & Dampak
Apa kebaruan (novelty) dari penelitian ini dibandingkan riset terdahulu? (2 kalimat)

### 🌍 Implikasi Praktis
Bagaimana praktisi atau masyarakat umum dapat menggunakan hasil penelitian ini? (2 kalimat)

INSTRUKSI PENTING:
- Gunakan Bahasa Indonesia formal (EYD).
- Maksimal 300 kata.
- Jangan gunakan kata-kata klise seperti "Penelitian ini..." di setiap awal paragraf.
- Fokus pada substansi ilmiah.`;

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
