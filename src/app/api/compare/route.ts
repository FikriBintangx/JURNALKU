import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';
import { callOpenRouter } from '@/services/openRouterService';

/**
 * /api/compare — AI Paper Comparison
 *
 * Tiers:
 * 1. Gemini-2.0-Flash (Primary)
 * 2. OpenRouter Llama 3.1 70B (Secondary)
 * 3. Local Metadata Comparison (Tertiary/Fallback)
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
Judul: ${(p.title || 'Tidak diketahui').slice(0, 300)}
Abstrak: ${(p.abstract || 'Tidak tersedia').slice(0, 2000)}
Tahun: ${p.year || p.yearPublished || 'N/A'}
Sitasi: ${p.citationCount || p.citations || 0}
Venue: ${p.venue || 'N/A'}
Penulis: ${Array.isArray(p.authors) ? p.authors.join(', ') : (p.authors || 'N/A')}
`).join('\n---\n');

    const titleHeaders = papers.map((p: any) =>
      (p.title || 'Jurnal').substring(0, 45) + (p.title?.length > 45 ? '...' : '')
    );

    const systemPrompt = `Anda adalah Senior Research Analyst AI. Bandingkan jurnal-jurnal akademik berikut secara mendalam, kritis, dan objektif.

TUGAS ANDA:
1. Ekstrak perbandingan teknis: Metodologi, Fokus Riset, Temuan Kunci, Novelty, dan Research Gap.
2. Berikan skor kuantitatif (1-10) untuk: Kebaruan (Novelty), Metodologi (Methodology), Inovasi (Innovation), dan Relevansi Masa Depan (Future Use).
3. Buat "Critical Verdict" yang mensintesis keunggulan masing-masing paper.
4. Pastikan bahasa yang digunakan formal dan akademik (Bahasa Indonesia).

WAJIB kembalikan HANYA JSON valid dengan struktur ini:
{
  "headers": ["Aspek", ${titleHeaders.map((t: string) => `"${t}"`).join(', ')}],
  "rows": [
    ["Fokus Utama", ...],
    ["Metodologi", ...],
    ["Temuan Kunci", ...],
    ["Novelty", ...],
    ["Research Gap", ...],
    ["Limitasi", ...]
  ],
  "radarData": [
    { "subject": "Novelty", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": <int 1-10>`).join(', ')} },
    { "subject": "Methodology", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": <int 1-10>`).join(', ')} },
    { "subject": "Innovation", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": <int 1-10>`).join(', ')} },
    { "subject": "Future Use", ${papers.map((_: any, i: number) => `"jurnal${i + 1}": <int 1-10>`).join(', ')} }
  ],
  "verdict": {
    "summary": "Mensintesis perbedaan utama dan kontribusi masing-masing jurnal...",
    "recommendation": "Rekomendasi strategis untuk peneliti..."
  },
  "conclusion": "Kesimpulan akhir dalam satu kalimat padat."
}`;

    const fullPrompt = `${systemPrompt}\n\nJurnal yang dibandingkan:\n${context}`;

    let aiResponse: string | null = null;
    let providerUsed = 'gemini';

    // Tier 1: Gemini
    try {
      const result = await geminiService.generateAI({
        paperId: papers.map((p: any) => p.paperId || p.id || 'unknown').join('-'),
        type: 'comparison',
        prompt: fullPrompt,
        title: 'Multi-Paper Comparison',
        abstract: context.slice(0, 1000),
      });

      if (result.success && !result.fallback) {
        aiResponse = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      }
    } catch (e) {
      console.warn('[COMPARE API] Gemini failed, falling back to OpenRouter');
    }

    // Tier 2: OpenRouter (if Gemini fails or returns fallback)
    if (!aiResponse) {
      try {
        providerUsed = 'openrouter';
        const orResult = await callOpenRouter(fullPrompt, 20000, 'meta-llama/llama-3.1-70b-instruct');
        if (orResult) aiResponse = orResult;
      } catch (e) {
        console.warn('[COMPARE API] OpenRouter also failed');
      }
    }

    let parsed: any = null;
    if (aiResponse) {
      try {
        const cleaned = aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (e) {
        console.error('[COMPARE API] JSON Parse Error:', e);
      }
    }

    // Tier 3: Local Metadata Comparison Fallback
    if (!parsed || !parsed.headers) {
      parsed = buildSmartFallback(papers);
      providerUsed = 'local-engine';
    }

    return NextResponse.json({ ...parsed, provider: providerUsed });

  } catch (error: any) {
    console.error('[COMPARE API] Critical Error:', error.message);
    const body = await request.clone().json().catch(() => ({ papers: [] }));
    return NextResponse.json({ ...buildSmartFallback(body?.papers || []), provider: 'error-fallback' });
  }
}

function buildSmartFallback(papers: any[]) {
  const titles = papers.map((p: any) => 
    (p.title || 'Jurnal').substring(0, 40) + (p.title?.length > 40 ? '...' : '')
  );

  // Simple Analysis Logic
  const getCommonKeywords = (p: any) => {
    const text = `${p.title} ${p.abstract}`.toLowerCase();
    const common = ['system', 'model', 'analysis', 'impact', 'development', 'study', 'empirical', 'digital', 'education', 'social'];
    return common.filter(k => text.includes(k)).slice(0, 3).join(', ') || 'General Research';
  };

  const getMethodologyHint = (p: any) => {
    const text = (p.abstract || '').toLowerCase();
    if (text.includes('survey') || text.includes('statistic') || text.includes('data analysis')) return 'Kuantitatif / Statistik';
    if (text.includes('interview') || text.includes('case study') || text.includes('qualitative')) return 'Kualitatif / Studi Kasus';
    if (text.includes('literature') || text.includes('review')) return 'Literature Review';
    return 'Metodologi Umum';
  };

  const latestYear = Math.max(...papers.map(p => parseInt(p.year) || 0));

  return {
    headers: ['Aspek', ...titles],
    rows: [
      ['Fokus Domain', ...papers.map(p => getCommonKeywords(p))],
      ['Estimasi Metodologi', ...papers.map(p => getMethodologyHint(p))],
      ['Tahun Publikasi', ...papers.map(p => p.year || 'N/A')],
      ['Metrik Sitasi', ...papers.map(p => `${p.citationCount || 0} Citations`)],
      ['Kontribusi Utama', ...papers.map(p => p.abstract ? p.abstract.slice(0, 100) + '...' : 'Data tidak tersedia')],
      ['Status Kebaruan', ...papers.map(p => (parseInt(p.year) === latestYear && latestYear > 0) ? 'Potensi High Novelty' : 'Studi Dasar')]
    ],
    radarData: [
      { subject: 'Novelty', ...Object.fromEntries(papers.map((p, i) => [`jurnal${i + 1}`, (parseInt(p.year) > 2022 ? 8 : 6)])) },
      { subject: 'Methodology', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 7])) },
      { subject: 'Innovation', ...Object.fromEntries(papers.map((p, i) => [`jurnal${i + 1}`, (p.citationCount > 50 ? 9 : 6)])) },
      { subject: 'Future Use', ...Object.fromEntries(papers.map((_, i) => [`jurnal${i + 1}`, 7])) }
    ],
    verdict: {
      summary: `Analisis menunjukkan variasi antara paper terbitan ${Math.min(...papers.map(p => parseInt(p.year) || 2000))} hingga ${latestYear}. Jurnal dengan sitasi tertinggi cenderung memberikan fondasi teoritis yang lebih kuat, sementara jurnal terbaru menawarkan kebaruan konteks digital.`,
      recommendation: 'Gunakan kombinasi jurnal terbaru untuk novelty dan jurnal dengan sitasi tinggi untuk validitas metodologi.'
    },
    conclusion: 'Sintesis metadata menunjukkan adanya korelasi antara tahun publikasi dan fokus teknologi yang digunakan.',
    fallback: true
  };
}
