/**
 * DOAJ Provider (Directory of Open Access Journals)
 * Public API — no auth required
 * Docs: https://doaj.org/api/
 */
import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/filters';

const TIMEOUT = 10000;

export async function fetchDOAJ(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://doaj.org/api/search/articles', {
      params: {
        q: query,
        pageSize: Math.min(limit, 100),
        page: 1,
        sort: 'score',
      },
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'JurnalStar/1.0' },
    });

    const items = res.data?.results || [];
    const papers: UniversalPaperEnriched[] = [];

    for (const item of items) {
      const bib = item.bibjson || {};
      const title = (bib.title || '').trim();
      if (!title) continue;

      const authors = (bib.author || []).map((a: any) => ({
        name: [a.firstname, a.lastname].filter(Boolean).join(' ') || 'Unknown',
      }));

      const year = parseInt(bib.year) || 0;
      const doi = bib.identifier?.find((id: any) => id.type === 'doi')?.id || '';
      const abstract = (bib.abstract || '').trim();
      const venue = bib.journal?.title || '';
      const keywords = (bib.keywords || []).filter(Boolean);
      const pdfUrl = bib.link?.find((l: any) => l.type === 'fulltext')?.url || '';

      papers.push({
        id: `doaj_${item.id || Math.random().toString(36).slice(2)}`,
        paperId: `doaj_${item.id || Math.random().toString(36).slice(2)}`,
        title,
        abstract,
        authors,
        year,
        citations: 0,
        doi,
        source: 'doaj',
        isOpenAccess: true, // DOAJ is all open access
        pdfUrl,
        url: doi ? `https://doi.org/${doi}` : `https://doaj.org/article/${item.id}`,
        externalUrl: doi ? `https://doi.org/${doi}` : `https://doaj.org/article/${item.id}`,
        venue,
        keywords,
        docType: 'journal_article',
        relevanceScore: 0,
      });
    }

    console.log(`[PROVIDER] DOAJ: ${papers.length} results`);
    return papers;

  } catch (e: any) {
    console.error(`[PROVIDER] DOAJ error: ${e.message}`);
    return [];
  }
}
