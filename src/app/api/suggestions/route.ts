import { NextResponse } from 'next/server';
import { callOpenRouter } from '@/services/openRouterService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ data: [] });
  }

  try {
    // 1. Fetch from Semantic Scholar for real paper titles
    const scholarUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=4&fields=title`;
    
    const [scholarRes, aiSuggestions] = await Promise.allSettled([
      fetch(scholarUrl, { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 } 
      }).then(res => res.ok ? res.json() : null),
      
      // 2. Fetch AI Suggestions for semantic completions and typo fixing
      callOpenRouter(
        `Berikan 3 saran kata kunci riset akademik yang sangat relevan dan spesifik untuk query: "${query}". 
        Jika ada typo, perbaiki secara otomatis. 
        Format jawaban hanya berupa list kata kunci dipisahkan koma, tanpa penjelasan lain. 
        Contoh: AI in Education, Machine Learning for Health, Digital Ethics`,
        5000 // 5s timeout for suggestions
      ).catch(() => null)
    ]);

    const papers = scholarRes.status === 'fulfilled' && scholarRes.value?.data 
      ? scholarRes.value.data.map((p: any) => ({ title: p.title, type: 'paper' }))
      : [];

    const topics = aiSuggestions.status === 'fulfilled' && aiSuggestions.value
      ? aiSuggestions.value.split(',').map(s => ({ title: s.trim(), type: 'topic' }))
      : [];

    // Combine and prioritize
    const combined = [...topics, ...papers].filter(item => item.title).slice(0, 8);

    return NextResponse.json({ data: combined });
  } catch (error: any) {
    console.error('Suggestion Proxy Error:', error.message);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
