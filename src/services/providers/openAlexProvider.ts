import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * OpenAlex Provider (TIER_1)
 * A massive, open catalog of the global research system. 
 * Completely free API with no auth required for politeness pool (but recommended to add email).
 */
export async function fetchOpenAlex(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://api.openalex.org/works', {
      params: {
        search: query,
        per_page: limit,
        // mailto: 'YOUR_EMAIL@domain.com' // Politeness pool
      },
      timeout: 8000
    });

    const items = res.data?.results || [];
    
    return items.map((item: any) => {
      const id = item.id ? item.id.replace('https://openalex.org/', '') : Math.random().toString(36).substring(7);
      
      return {
        id: `openalex-${id}`,
        paperId: id,
        title: item.title || 'Untitled',
        abstract: item.abstract_inverted_index ? reconstructAbstract(item.abstract_inverted_index) : '',
        authors: (item.authorships || []).map((a: any) => ({ 
            name: a.author?.display_name || ''
        })),
        year: item.publication_year || 0,
        citations: item.cited_by_count || 0,
        doi: item.doi ? item.doi.replace('https://doi.org/', '') : '',
        source: 'openalex',
        isOpenAccess: item.open_access?.is_oa || false,
        pdfUrl: item.open_access?.oa_url || '',
        url: item.doi || item.id,
        externalUrl: item.id || '',
        venue: item.primary_location?.source?.display_name || '',
        keywords: (item.concepts || []).map((c: any) => c.display_name),
        docType: item.type || 'journal_article',
        relevanceScore: 0 // Will be populated by aggregator or reranker
      };
    });
  } catch (error: any) {
    console.error(`[PROVIDER] OpenAlex error: ${error.message}`);
    return [];
  }
}

// OpenAlex returns abstract as an inverted index to save space, we need to reconstruct it
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return '';
    try {
        const wordArr: string[] = [];
        for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const pos of positions) {
                wordArr[pos] = word;
            }
        }
        return wordArr.filter(Boolean).join(' ');
    } catch {
        return '';
    }
}
