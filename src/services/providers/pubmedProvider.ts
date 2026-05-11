/**
 * PubMed Provider
 * Public API — no auth required (rate limits apply)
 * Docs: https://www.ncbi.nlm.nih.gov/home/develop/api/
 */
import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/filters';

const TIMEOUT = 10000;
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TOOL = 'JurnalStar';
const EMAIL = 'contact@jurnalstar.id';

export async function fetchPubMed(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    // Step 1: Search for PMIDs
    const searchRes = await axios.get(`${BASE}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: query,
        retmax: Math.min(limit, 50),
        retmode: 'json',
        sort: 'relevance',
        tool: TOOL,
        email: EMAIL,
      },
      timeout: TIMEOUT,
    });

    const pmids: string[] = searchRes.data?.esearchresult?.idlist || [];
    if (pmids.length === 0) return [];

    // Step 2: Fetch summaries for PMIDs
    const summaryRes = await axios.get(`${BASE}/esummary.fcgi`, {
      params: {
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'json',
        tool: TOOL,
        email: EMAIL,
      },
      timeout: TIMEOUT,
    });

    const result = summaryRes.data?.result || {};
    const papers: UniversalPaperEnriched[] = [];

    for (const pmid of pmids) {
      const item = result[pmid];
      if (!item) continue;

      const title = (item.title || '').replace(/\[.*?\]\.?$/, '').trim();
      if (!title) continue;

      const authors = (item.authors || []).map((a: any) => ({ name: a.name || 'Unknown' }));
      const year = parseInt(item.pubdate?.split(' ')?.[0]) || 0;
      const doi = (item.elocationid || '').replace('doi: ', '') || '';

      papers.push({
        id: `pubmed_${pmid}`,
        paperId: `pubmed_${pmid}`,
        title,
        abstract: '', // Abstract requires separate efetch call — skip to avoid extra requests
        authors,
        year,
        citations: 0,
        doi,
        source: 'pubmed',
        isOpenAccess: item.pmcid ? true : false,
        pdfUrl: item.pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${item.pmcid}/pdf/` : '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        externalUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        venue: item.source || '',
        keywords: [],
        docType: 'journal_article',
        relevanceScore: 0,
      });
    }

    console.log(`[PROVIDER] PubMed: ${papers.length} results`);
    return papers;

  } catch (e: any) {
    console.error(`[PROVIDER] PubMed error: ${e.message}`);
    return [];
  }
}
