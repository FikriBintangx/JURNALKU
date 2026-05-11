import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

/**
 * /api/compare — AI Paper Comparison
 *
 * Uses the full 5-tier AI fallback chain (Gemini → Grok → OpenRouter → HuggingFace → static).
 * Returns a rich JSON comparison matrix: headers, rows, radarData, verdict.
 * NEVER returns 500 — always 200 with fallback content on AI failure.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const papers = body?.papers;

    if (!Array.isArray(papers) || papers.length < 2) {
      return NextResponse.json({
        error: true,
        message: 'Minimal 2 jurnal diperlukan untuk perbandingan.',
      }, { status: 400 });
    }

    const context = papers.map((p: any, i: number) => `
Jurnal ${i + 1}:
Judul: ${(p.title || 'Tidak diketahui').slice(0, 200)}
Abstrak: ${(p.abstract || 'Tidak tersedia').slice(0, 800)}
Tahun: ${p.year || p.yearPublished || 'N/A'}
Sitasi: ${p.citationCount || p.citations || 0}
Venue: ${p.venue || 'N/A'}
`).join('\n---\n');

    const titleHeaders = papers.map((p: any) =>
      (p.title || 'Jurnal').substring(0, 40) + '...'
    );

    const prompt = `Anda adalah Senior Research Analyst AI. Bandingkan jurnal-jurnal akademik berikut secara mendalam dan kritis.

TUGAS ANDA:
1. Ekstrak perbandingan teknis: Metodologi, Fokus Riset, Temuan Kunci, Novelty, dan Research Gap.
2. Berikan skor kuantitatif (1-10) untuk: Kebaruan, Metodologi, Relevansi Masa Depan, dan Kedalaman Analisis.
3. Buat "Critical Verdict" tentang jurnal mana yang paling unggul.

Jurnal yang dibandingkan:
${context}

WAJIB kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan):
{
  "headers": ["Aspek", ${titleHeaders.map((t: string) => `"${t}"`).join(', ')}],
  "rows": [
    ["Fokus Utama", ${papers.map(() => '"..."').join(', ')}],
    ["Metodologi", ${papers.map(() => '"..."').join(', ')}],
    ["Temuan Kunci", ${papers.map(() => '"..."').join(', ')}],
    ["Novelty", ${papers.map(() => '"..."').join(', ')}],
    ["Research Gap", ${papers.map(() => '"..."').join(', ')}],
    ["Limitasi", ${papers.map(() => '"..."').join(', ')}]
  ],
  "radarData": [
    { "subject": "Novelty", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": 7`).join(', ')} },
    { "subject": "Metodologi", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": 7`).join(', ')} },
    { "subject": "Innovation", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": 7`).join(', ')} },
    { "subject": "Future Use", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": 7`).join(', ')} }
  ],
  "verdict": {
    "summary": "Ringkasan kritis perbandingan...",
    "recommendation": "Rekomendasi untuk penelitian lanjutan..."
  },
  "conclusion": "Ringkasan 1 kalimat."
}`;

    const result = await geminiService.generateAI({
      paperId: papers.map((p: any) => p.paperId || p.id || 'unknown').join('-'),
      type: 'comparison',
      prompt,
      title: 'Multi-Paper Comparison',
      abstract: context.slice(0, 500),
    });

    // Parse JSON from the AI response
    const rawText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    const jsonMatch = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

    let parsed: any;
    try {
      const match = jsonMatch.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    // If parse fails, generate structural fallback so UI still renders
    if (!parsed || !parsed.headers) {
      parsed = buildFallbackComparison(papers);
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('[COMPARE API] Error:', error.message);
    // Extract papers safely and return structural fallback — never 500
    try {
      const body = await request.clone().json().catch(() => ({ papers: [] }));
      const fallback = buildFallbackComparison(body?.papers || []);
      return NextResponse.json(fallback);
    } catch {
      return NextResponse.json(buildFallbackComparison([]));
    }
  }
}

function buildFallbackComparison(papers: any[]) {
  const titles = papers.length > 0
    ? papers.map((p: any) => (p.title || 'Jurnal').substring(0, 40) + '...')
    : ['Jurnal 1', 'Jurnal 2'];

  return {
    headers: ['Aspek', ...titles],
    rows: [
      ['Fokus Utama', ...papers.map((p: any) => p.title?.slice(0, 80) || 'Tidak diketahui')],
      ['Metodologi', ...papers.map(() => 'Analisis mendalam diperlukan')],
      ['Temuan Kunci', ...papers.map((p: any) => p.abstract?.slice(0, 100) || 'Lihat abstrak lengkap')],
      ['Novelty', ...papers.map(() => 'Memerlukan analisis lebih lanjut')],
      ['Research Gap', ...papers.map(() => 'Gunakan AI Enrichment untuk deteksi gap')],
      ['Limitasi', ...papers.map(() => 'Periksa bagian limitasi dalam teks penuh')],
    ],
    radarData: [
      { subject: 'Novelty', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 6])) },
      { subject: 'Metodologi', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 6])) },
      { subject: 'Innovation', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 6])) },
      { subject: 'Future Use', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 6])) },
    ],
    verdict: {
      summary: 'Perbandingan otomatis tidak tersedia saat ini. Silakan coba kembali atau aktifkan AI Enrichment.',
      recommendation: 'Baca abstrak masing-masing jurnal secara manual untuk perbandingan awal.',
    },
    conclusion: 'Analisis AI sementara tidak tersedia. Data jurnal berhasil dimuat.',
    fallback: true,
  };
}
