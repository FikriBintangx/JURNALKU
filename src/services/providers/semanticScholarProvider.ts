import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * Semantic Scholar Provider (TIER_1)
 * High-quality semantic academic graph. Excellent citation data.
 */
export async function fetchSemanticScholar(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const fields = 'paperId,title,abstract,authors,year,citationCount,isOpenAccess,openAccessPdf,url,venue,fieldsOfStudy';
    
    const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
      params: {
        query: query,
        limit: limit,
        fields: fields
      },
      timeout: 8000
    });

    const items = res.data?.data || [];
    
    return items.map((item: any) => {
      return {
        id: `semantic-${item.paperId}`,
        paperId: item.paperId,
        title: item.title || 'Untitled',
        abstract: item.abstract || '',
        authors: (item.authors || []).map((a: any) => ({ name: a.name })),
        year: item.year || 0,
        citations: item.citationCount || 0,
        doi: '', // Often requires an extra call or different fields parameter to get externalIds.DOI
        source: 'semanticscholar',
        isOpenAccess: item.isOpenAccess || false,
        pdfUrl: item.openAccessPdf?.url || '',
        url: item.url || '',
        externalUrl: item.url || '',
        venue: item.venue || '',
        keywords: item.fieldsOfStudy || [],
        docType: 'journal_article',
        relevanceScore: 0
      };
    });
  } catch (error: any) {
    console.error(`[PROVIDER] Semantic Scholar error: ${error.message}`);
    return [];
  }
}
