import { NextResponse } from 'next/server';
import { searchAggregator } from '@/services/searchAggregator';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const normalizedQuery = searchAggregator.normalizeAcademicQuery(query);

  try {
    // Artificial delay to prevent spamming
    await new Promise(r => setTimeout(r, 200));

    // Try simple fetch first
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(normalizedQuery)}&limit=5&fields=title`;
    
    console.log('Fetching suggestions for:', query);
    
    const response = await fetch(url, { 
      headers: { 'Accept': 'application/json' },
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error(`Semantic Scholar Suggestion Error (${status}):`, text);
      return NextResponse.json({ data: [], error: status }, { status: 200 }); // Return 200 with empty data to avoid client crash
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Suggestion Proxy Fatal Error:', error.message);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
