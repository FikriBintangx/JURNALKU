import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const { papers } = await request.json(); // Array of { paperId, title, abstract }

    if (!papers || !Array.isArray(papers) || papers.length < 2) {
      return NextResponse.json({ error: true, message: "Minimal 2 jurnal diperlukan untuk perbandingan" }, { status: 400 });
    }

    const combinedPaperId = papers.map(p => p.paperId).sort().join('-');
    const combinedContent = papers.map((p, i) => `Jurnal ${i + 1}:\nTitle: ${p.title}\nAbstract: ${p.abstract}`).join('\n\n---\n\n');

    const prompt = `AUTONOMOUS MULTI-PAPER COMPARISON ENGINE:
Lakukan analisis komparatif mendalam antara jurnal-jurnal akademik berikut.

Parameter Perbandingan:
1. Metodologi (Perbandingan teknik, validitas, dan desain penelitian)
2. Teori & Landasan Kognitif (Persamaan dan perbedaan kerangka teori)
3. Temuan & Hasil (Deteksi konvergensi atau kontradiksi hasil)
4. Variabel & Demografi (Perbedaan fokus subjek dan cakupan data)
5. Keterbatasan & Kesimpulan (Kekuatan bukti dan kualitas metodologi)

Ringkasan Analisis:
- Skor Kemiripan (Similarity Score)
- Skor Kontradiksi (Contradiction Score)
- Perbandingan Novelty (Siapa yang paling baru/unik?)
- Skor Kualitas Metodologi

JAWAB DALAM BAHASA INDONESIA AKADEMIK. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan setiap kategori.

Daftar Jurnal:
${combinedContent}`;

    // We can't use the standard generateAI here because it expects title/abstract separately
    // I'll manually call the service or adjust the service to be more flexible.
    // For now, I'll pass a dummy title/abstract to keep it consistent with the service's signature.
    
    const result = await geminiService.generateAI({
      paperId: combinedPaperId,
      type: 'comparison',
      prompt,
      title: "Multiple Papers Comparison",
      abstract: "Combined abstracts provided in prompt."
    });

    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[API COMPARISON ERROR]', error);
    return NextResponse.json({ error: true, message: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
