import { NextResponse } from 'next/server';

export const revalidate = 0; // No static cache — scope param needs dynamic routing

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'international';

  try {
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

    // Rotate topics daily
    const topics = [
      "artificial intelligence", "machine learning", "climate change",
      "quantum computing", "neuroscience", "renewable energy",
      "public health", "nanotechnology", "robotics", "cybersecurity",
      "economics", "sustainable agriculture", "data science"
    ];
    const dailyTopic = topics[dayIndex % topics.length];
    const currentYear = today.getFullYear();

    // Build OpenAlex filter based on scope
    let filter = `publication_year:${currentYear - 2}-${currentYear}`;
    if (scope === 'indonesia') {
      // Filter by works affiliated with Indonesian institutions (country code ID)
      filter += ',institutions.country_code:ID';
    }

    const url = `https://api.openalex.org/works?search=${encodeURIComponent(dailyTopic)}&filter=${filter}&sort=cited_by_count:desc&per-page=6`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'JurnalStar/1.0 (https://jurnalstar.com)' }
    });

    if (!response.ok) throw new Error("Failed to fetch from OpenAlex");

    const data = await response.json();

    const trending = (data.results || []).map((work: any) => ({
      id: work.id.replace('https://openalex.org/', ''),
      title: work.title || 'Untitled',
      year: work.publication_year || currentYear,
      citations: work.cited_by_count || 0,
      source: 'openalex',
      venue: work.primary_location?.source?.display_name || 'Unknown Journal',
    }));

    return NextResponse.json({
      success: true,
      data: trending,
      source: 'openalex-daily-scrape',
      topic: dailyTopic,
      scope,
    });

  } catch (error: any) {
    console.error("[TRENDING] Error:", error.message);

    return NextResponse.json({
      success: true,
      data: [
        { id: 'W3121261050', title: 'Attention Is All You Need', year: 2017, citations: 125000, source: 'openalex', venue: 'NIPS' },
        { id: 'W2966041414', title: 'Deep learning', year: 2015, citations: 55000, source: 'openalex', venue: 'Nature' },
        { id: 'trend-3', title: 'CRISPR Gene Editing Applications', year: 2024, citations: 432, source: 'openalex', venue: 'Nature Biotechnology' },
      ],
      source: 'fallback',
      scope,
    });
  }
}

