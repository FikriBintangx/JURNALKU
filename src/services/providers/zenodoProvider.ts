/**
 * Zenodo Provider
 * Public API — no auth required for basic searches
 * Docs: https://developers.zenodo.org/
 */
import axios from 'axios';
import type { UniversalPaperEnriched } from '@/types/filters';

const TIMEOUT = 10000;

function mapResourceType(type: string): string {
  const map: Record<string, string> = {
    publication: 'journal_article',
    'publication-article': 'journal_article',
    'publication-conferencepaper': 'conference_paper',
    'publication-thesis': 'thesis',
    'publication-report': 'review',
    dataset: 'unknown',
    software: 'unknown',
  };
  return map[type] || 'unknown';
}

export async function fetchZenodo(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const res = await axios.get('https://zenodo.org/api/records', {
      params: {
        q: query,
        size: Math.min(limit, 50),
        page: 1,
        sort: 'mostrelevant',
        type: 'publication', // Filter to academic publications only
      },
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'JurnalStar/1.0' },
    });

    const items = res.data?.hits?.hits || [];
    const papers: UniversalPaperEnriched[] = [];

    for (const item of items) {
      const meta = item.metadata || {};
      const title = (meta.title || '').trim();
      if (!title) continue;

      const authors = (meta.creators || []).map((c: any) => ({
        name: c.name || c.fullname || 'Unknown',
      }));

      const year = parseInt(meta.publication_date?.slice(0, 4)) || 0;
      const doi = meta.doi || item.doi || '';
      const abstract = (meta.description || '').replace(/<[^>]*>/g, '').trim();
      const keywords = (meta.keywords || []).filter(Boolean);
      const resourceType = meta.resource_type?.type || '';
      const subtype = meta.resource_type?.subtype || '';
      const typeKey = subtype ? `${resourceType}-${subtype}` : resourceType;
      const docType = mapResourceType(typeKey) as any;

      const pdfUrl = item.files?.find((f: any) => f.key?.endsWith('.pdf'))?.links?.self || '';
      const recordId = item.id?.toString() || '';

      papers.push({
        id: `zenodo_${recordId}`,
        paperId: `zenodo_${recordId}`,
        title,
        abstract,
        authors,
        year,
        citations: 0,
        doi,
        source: 'zenodo',
        isOpenAccess: true,
        pdfUrl,
        url: `https://zenodo.org/records/${recordId}`,
        externalUrl: `https://zenodo.org/records/${recordId}`,
        venue: meta.journal?.title || 'Zenodo',
        keywords,
        docType,
        relevanceScore: 0,
      });
    }

    console.log(`[PROVIDER] Zenodo: ${papers.length} results`);
    return papers;

  } catch (e: any) {
    console.error(`[PROVIDER] Zenodo error: ${e.message}`);
    return [];
  }
}
