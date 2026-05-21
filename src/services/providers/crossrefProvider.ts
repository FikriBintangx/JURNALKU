import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * Crossref Provider (TIER_2)
 * Excellent for metadata, though often lacks full abstracts depending on publisher.
 */
export async function fetchCrossref(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://api.crossref.org/works', {
      params: {
        query: query,
        rows: limit,
        // Polite pool email recommended here as well
      },
      timeout: 8000
    });

    const items = res.data?.message?.items || [];
    
    return items.map((item: any) => {
      const doi = item.DOI || '';
      
      return {
        id: `crossref-${doi || Math.random().toString(36).substring(7)}`,
        paperId: doi,
        title: (item.title && item.title[0]) || 'Untitled',
        // Crossref sometimes embeds abstract as XML/HTML snippet
        abstract: item.abstract ? item.abstract.replace(/<[^>]*>?/gm, '').trim() : '',
        authors: (item.author || []).map((a: any) => ({ 
            name: `${a.given || ''} ${a.family || ''}`.trim() 
        })).filter((a: any) => a.name !== ''),
        year: item.issued?.['date-parts']?.[0]?.[0] || 0,
        citations: item['is-referenced-by-count'] || 0,
        doi: doi,
        source: 'crossref',
        isOpenAccess: item.link?.some((l: any) => l['content-type'] === 'application/pdf') || false,
        pdfUrl: item.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL || '',
        url: item.URL || `https://doi.org/${doi}`,
        externalUrl: item.URL || '',
        venue: (item['container-title'] && item['container-title'][0]) || '',
        keywords: item.subject || [],
        docType: item.type || 'journal-article',
        relevanceScore: 0
      };
    });
  } catch (error: any) {
    console.error(`[PROVIDER] Crossref error: ${error.message}`);
    return [];
  }
}
