/**
 * arXiv Provider
 * Public API — no auth required
 * Docs: https://arxiv.org/help/api
 */
import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/filters';

const TIMEOUT = 10000;

function parseArxivXML(xml: string): any[] {
  const entries: any[] = [];
  const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

  for (const entry of entryMatches) {
    const getText = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].replace(/<[^>]*>/g, '').trim() : '';
    };
    const getAll = (tag: string) => {
      const matches = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g')) || [];
      return matches.map(m => m.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    };

    const id = getText('id').split('/').pop()?.replace('v1','').replace('v2','') || '';
    const title = getText('title').replace(/\s+/g, ' ');
    const abstract = getText('summary').replace(/\s+/g, ' ');
    const published = getText('published');
    const year = parseInt(published.slice(0, 4)) || 0;
    const authorNames = getAll('name');
    const doi = getText('arxiv:doi');
    const pdfUrl = entry.match(/href="([^"]*pdf[^"]*)"/) ?
      entry.match(/href="([^"]*pdf[^"]*)"/)![1] :
      `https://arxiv.org/pdf/${id}`;

    if (!title) continue;

    entries.push({
      id: `arxiv_${id}`,
      paperId: `arxiv_${id}`,
      title,
      abstract,
      authors: authorNames.map(name => ({ name })),
      year,
      citations: 0,
      doi,
      source: 'arxiv',
      isOpenAccess: true,
      pdfUrl,
      url: `https://arxiv.org/abs/${id}`,
      externalUrl: `https://arxiv.org/abs/${id}`,
      venue: 'arXiv',
      keywords: [],
      docType: 'preprint' as any,
      relevanceScore: 0,
    });
  }
  return entries;
}

export async function fetchArxiv(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://export.arxiv.org/api/query', {
      params: {
        search_query: `all:${query}`,
        start: 0,
        max_results: Math.min(limit, 50),
        sortBy: 'relevance',
      },
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'JurnalStar/1.0' },
    });

    const papers = parseArxivXML(res.data || '');
    console.log(`[PROVIDER] arXiv: ${papers.length} results`);
    return papers;
  } catch (e: any) {
    console.error(`[PROVIDER] arXiv error: ${e.message}`);
    return [];
  }
}
