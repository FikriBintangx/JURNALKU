/**
 * Tavily AI Service
 * 
 * Optimized search engine for LLMs to get real-time, clean web content.
 * Used to enrich AI analysis with the latest facts from the web.
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function searchWeb(query: string, searchDepth: 'basic' | 'advanced' = 'basic'): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY_MISSING');

  console.log(`[TAVILY] Searching web for: ${query}`);

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`TAVILY_ERROR_${response.status}: ${err}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('[TAVILY] Search failed:', error.message);
    throw error;
  }
}
