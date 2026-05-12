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
      Berikan analisis ringkas (2-3 paragraf) tentang bagaimana topik jurnal ini berkaitan dengan tren, berita, atau perkembangan terbaru di dunia nyata saat ini berdasarkan konteks web di atas.
      
      Format Output:
      ## Tren Web Saat Ini
      (Jelaskan apa yang sedang hangat dibahas di internet terkait topik ini)
      
      ## Hubungan dengan Jurnal
      (Jelaskan relevansi temuan jurnal ini dengan situasi dunia nyata sekarang)
      
      ## Rekomendasi Aksi
      (Berikan 1-2 saran praktis berdasarkan data terbaru)
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
