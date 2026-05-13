import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * BASE (Bielefeld Academic Search Engine) Provider.
 * One of the most voluminous search engines for academic open access web resources.
 */
export async function fetchBASE(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://api.base-search.net/cgi-bin/msearch.pl', {
      params: {
        q: query,
        hits: limit,
        format: 'json'
      },
      timeout: 5000 // Shorter timeout for BASE
    });

    const items = res.data?.response?.docs || [];
    
    return items.map((item: any) => {
      const title = Array.isArray(item.dc_title) ? item.dc_title[0] : item.dc_title;
      const id = item.dc_identifier || Math.random().toString(36).substr(2, 9);
      const authors = (item.dc_creator || []).map((name: string) => ({ name }));
      const abstract = Array.isArray(item.dc_description) ? item.dc_description.join(' ') : (item.dc_description || '');
      
      return {
        id: `base-${id}`,
        paperId: id,
        title: title || 'Untitled',
        abstract: abstract.slice(0, 500),
        authors,
        year: parseInt(item.dc_date) || 0,
        citations: 0, // BASE doesn't always provide citation counts in search results
        doi: item.dc_identifier?.find((id: string) => id.startsWith('10.')) || '',
        source: 'base',
        isOpenAccess: true, // BASE is mostly Open Access
        pdfUrl: item.link || '',
        url: item.link || '',
        externalUrl: item.link || '',
        venue: item.dc_source || '',
        keywords: item.dc_subject || [],
        docType: 'journal_article',
        relevanceScore: 0
      };
    });
  } catch (error: any) {
    console.error(`[PROVIDER] BASE error: ${error.message}`);
    return [];
  }
}
