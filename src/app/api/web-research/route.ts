import { NextResponse } from 'next/server';
import { searchWeb } from '@/services/tavilyService';
import { geminiService } from '@/services/geminiService';

/**
 * Web Research API
 * 
 * 1. Search web via Tavily for the latest context on a topic.
 * 2. Pass the results to AI for a structured summary.
 * 3. Return insights that connect the journal paper to current events/trends.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, topic, model } = body;

    const query = topic || title;
    if (!query) {
      return NextResponse.json({ success: false, message: "Query (title/topic) is required" }, { status: 400 });
    }

    // 1. Get real-time web context
    console.log(`[WEB RESEARCH] Fetching web context for: ${query}`);
    const searchResults = await searchWeb(query, 'basic');
    
    const context = searchResults.results?.map((r: any) => 
      `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`
    ).join('\n\n') || "No web results found.";

    const answer = searchResults.answer || "";

    // 2. Process with AI
    const prompt = `
      Berikut adalah hasil pencarian web real-time tentang topik: "${query}"
      
      KONTEKS WEB:
      ${context}
      
      JAWABAN SINGKAT WEB:
      ${answer}
      
      TUGAS:
      Lakukan analisis sinergis antara tren dunia nyata saat ini dan literatur akademik. 
      Jelaskan bagaimana topik penelitian ini berkaitan dengan perkembangan terbaru.

      Struktur Analisis:
      1. Tinjauan Tren Global (Apa yang sedang terjadi saat ini?)
      2. Relevansi Saintifik (Bagaimana jurnal ini menjawab tantangan dunia nyata?)
      3. Implikasi & Rekomendasi (Aksi praktis berdasarkan data terbaru)

      JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan bagian.
    `;

    const result = await geminiService.generateAI({
      paperId: `web-${Date.now()}`,
      type: 'web-research',
      prompt,
      title: `Web Analysis: ${query}`,
      model
    });

    return NextResponse.json({
      success: result.success,
      data: result.data,
      sources: searchResults.results?.map((r: any) => ({ title: r.title, url: r.url }))
    });

  } catch (error: any) {
    console.error("[WEB RESEARCH ERROR]", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Gagal melakukan riset web real-time.",
      error: error.message 
    }, { status: 500 });
  }
}
