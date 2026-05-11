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

    const prompt = `Bandingkan jurnal-jurnal akademik berikut.
    
Tentukan:
1. Persamaan tema/topik
2. Perbedaan signifikan (metode, temuan, atau fokus)
3. Analisis metode terbaik di antara semuanya
4. Tren riset yang terlihat dari kumpulan jurnal ini

Gunakan bahasa Indonesia akademik.

Jurnal yang dibandingkan:
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
