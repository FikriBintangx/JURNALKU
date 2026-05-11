import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const paperId = resolvedParams.id;

  try {
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey && apiKey !== 'your_key_here') {
      headers['x-api-key'] = apiKey;
    }

    // Semantic Scholar Recommendations API
    const url = `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${paperId}?limit=10&fields=title,abstract,year,authors,url,venue,citationCount,isOpenAccess,openAccessPdf`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      return NextResponse.json({ data: [] }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Recommendations Proxy Error:', error.message);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
