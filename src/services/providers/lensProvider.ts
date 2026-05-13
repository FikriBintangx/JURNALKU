import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * Lens.org Provider - A powerful alternative to Google Scholar.
 * Focuses on high-quality metadata and patent-academic links.
 */
export async function fetchLens(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  const apiKey = process.env.LENS_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    // Gracefully skip if no key, avoiding 401 errors in log
    return [];
  }

  try {
    const res = await axios.get('https://api.lens.org/scholarly/search', {
      params: {
        query: `title:("${query}") OR abstract:("${query}")`,
        size: limit,
        sort: 'relevance:desc'
      },
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const items = res.data?.data || [];
    
    return items.map((item: any) => ({
      id: `lens-${item.lens_id}`,
      paperId: item.lens_id,
      title: item.title || 'Untitled',
      abstract: item.abstract || '',
      authors: (item.authors || []).map((a: any) => ({ name: a.display_name || 'Unknown' })),
      year: item.year_published || 0,
      citations: item.scholarly_citations_count || 0,
      doi: item.external_ids?.find((id: any) => id.type === 'doi')?.value || '',
      source: 'lens',
      isOpenAccess: !!item.is_open_access,
      pdfUrl: item.full_text_urls?.[0] || '',
      url: `https://www.lens.org/lens/scholar/article/${item.lens_id}`,
      externalUrl: `https://www.lens.org/lens/scholar/article/${item.lens_id}`,
      venue: item.source?.title || '',
      keywords: (item.fields_of_study || []),
      docType: 'journal_article',
      relevanceScore: 0
    }));
  } catch (error: any) {
    // Only log if it's not a 401 (already handled)
    if (error.response?.status !== 401) {
      console.error(`[PROVIDER] Lens.org error: ${error.message}`);
    }
    return [];
  }
}
