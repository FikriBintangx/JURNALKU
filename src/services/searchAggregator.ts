import axios from 'axios';
import { fetchArxiv } from './providers/arxivProvider';
import { fetchPubMed } from './providers/pubmedProvider';
import { fetchDOAJ } from './providers/doajProvider';
import { fetchZenodo } from './providers/zenodoProvider';
import type { UniversalPaperEnriched } from '@/types/filters';

// Re-export for compatibility with existing imports
export type UniversalPaper = UniversalPaperEnriched;

const FETCH_TIMEOUT = 10000;

// ─────────────────────────────────────────────────────────────
// Query expander — when results are sparse
// ─────────────────────────────────────────────────────────────
const QUERY_EXPANSIONS: Record<string, string[]> = {
  'tiktok shop': ['social commerce', 'e-commerce behavior', 'online shopping'],
  'gen z': ['generation z', 'young consumers', 'digital natives'],
  'machine learning': ['deep learning', 'neural network', 'artificial intelligence'],
  'covid': ['pandemic', 'SARS-CoV-2', 'coronavirus'],
  'blockchain': ['distributed ledger', 'smart contract', 'cryptocurrency'],
  'umkm': ['small medium enterprise', 'SME Indonesia', 'usaha mikro'],
  'pendidikan': ['education', 'learning', 'pedagogy'],
  'kesehatan': ['health', 'medical', 'public health'],
};

export const searchAggregator = {
  sanitizeQuery(rawQuery: string): string {
    if (!rawQuery || typeof rawQuery !== 'string') return '';
    try {
      return decodeURIComponent(rawQuery)
        .replace(/[<>{}[\]\\^`|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);
    } catch {
      return rawQuery.replace(/\s+/g, ' ').trim().slice(0, 300);
    }
  },

  simplifyQuery(query: string): string {
    return query.split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(' ');
  },

  expandQuery(query: string): string[] {
    const lower = query.toLowerCase();
    for (const [key, expansions] of Object.entries(QUERY_EXPANSIONS)) {
      if (lower.includes(key)) return expansions;
    }
    // Generic expansion: take first 2 words
    const terms = query.split(/\s+/).filter(w => w.length > 3);
    if (terms.length > 2) return [terms.slice(0, 2).join(' ')];
    return [];
  },

  /**
   * Main search entry point — runs all 8 providers in parallel.
   * Auto-retries with simplified/expanded queries if results are sparse.
   * Never throws.
   */
  async search(rawQuery: string, limit: number = 20): Promise<UniversalPaperEnriched[]> {
    const query = this.sanitizeQuery(rawQuery);
    if (!query) {
      console.warn("[SEARCH] Empty query.");
      return [];
    }

    const t0 = Date.now();
    console.log(`[SEARCH] Starting 8-provider search: "${query}"`);

    let papers = await this.runParallelFetch(query, limit);

    // Auto-retry with simplified query if sparse
    if (papers.length < 5 && query.split(/\s+/).length > 3) {
      const simplified = this.simplifyQuery(query);
      if (simplified && simplified !== query) {
        console.log(`[SEARCH] Sparse results (${papers.length}). Retry with simplified: "${simplified}"`);
        const extra = await this.runParallelFetch(simplified, limit);
        papers = this.deduplicate([...papers, ...extra]);
      }
    }

    // Auto-retry with expanded query if still sparse
    if (papers.length < 5) {
      const expansions = this.expandQuery(query);
      if (expansions.length > 0) {
        console.log(`[SEARCH] Still sparse. Trying expansion: "${expansions[0]}"`);
        const extra = await this.runParallelFetch(expansions[0], limit);
        papers = this.deduplicate([...papers, ...extra]);
      }
    }

    const ranked = this.rankResults(papers, query);
    const final = ranked.slice(0, limit);

    console.log(`[SEARCH] Done: ${papers.length} raw → ${ranked.length} unique → ${final.length} returned in ${Date.now() - t0}ms`);
    return final;
  },

  /**
   * Runs all 8 providers in parallel using Promise.allSettled.
   * Individual failures never crash the pipeline.
   *
   * Priority tiers:
   * - PRIMARY (always run): OpenAlex, CORE, Crossref
   * - SECONDARY (always run): Semantic Scholar, arXiv, PubMed
   * - OPTIONAL (run if needed): DOAJ, Zenodo
   */
  async runParallelFetch(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
    const perSource = Math.ceil(limit / 3);

    const [
      openAlex, core, crossref,       // PRIMARY
      semantic, arxiv, pubmed,        // SECONDARY
      doaj, zenodo                    // OPTIONAL
    ] = await Promise.allSettled([
      this.fetchOpenAlex(query, perSource),
      this.fetchCORE(query, perSource),
      this.fetchCrossref(query, perSource),
      this.fetchSemanticScholar(query, perSource),
      fetchArxiv(query, perSource),
      fetchPubMed(query, Math.ceil(perSource / 2)),
      fetchDOAJ(query, Math.ceil(perSource / 2)),
      fetchZenodo(query, Math.ceil(perSource / 2)),
    ]);

    const providerNames = ['OpenAlex', 'CORE', 'Crossref', 'Semantic Scholar', 'arXiv', 'PubMed', 'DOAJ', 'Zenodo'];
    const results = [openAlex, core, crossref, semantic, arxiv, pubmed, doaj, zenodo];
    const papers: UniversalPaperEnriched[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        const valid = result.value.filter(p => this.isValidPaper(p));
        if (valid.length > 0) console.log(`[PROVIDER] ${providerNames[i]}: ${valid.length} results`);
        papers.push(...(valid as UniversalPaperEnriched[]));
      } else if (result.status === 'rejected') {
        console.error(`[PROVIDER] ${providerNames[i]} failed: ${result.reason?.message}`);
      }
    });

    return papers;
  },

  isValidPaper(paper: any): boolean {
    return !!(
      paper &&
      paper.id &&
      paper.title &&
      typeof paper.title === 'string' &&
      paper.title.trim().length > 3
    );
  },

  deduplicate(papers: UniversalPaperEnriched[]): UniversalPaperEnriched[] {
    const seenDOI = new Set<string>();
    const seenTitle = new Set<string>();
    return papers.filter(paper => {
      const doi = (paper.doi || '').toLowerCase().trim();
      const title = (paper.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 80);
      if (!title) return false;
      if (doi && doi.length > 5) {
        if (seenDOI.has(doi)) return false;
        seenDOI.add(doi);
      } else {
        if (seenTitle.has(title)) return false;
        seenTitle.add(title);
      }
      return true;
    });
  },

  rankResults(papers: UniversalPaperEnriched[], query: string): UniversalPaperEnriched[] {
    const deduped = this.deduplicate(papers);
    const currentYear = new Date().getFullYear();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const maxCitations = Math.max(...deduped.map(p => p.citations || 0), 1);

    // Source priority boosts
    const sourcePriority: Record<string, number> = {
      openalex: 5, crossref: 4, semantic: 4, core: 3,
      pubmed: 3, arxiv: 3, doaj: 2, zenodo: 2,
    };

    return deduped.map(paper => {
      const titleLower = (paper.title || '').toLowerCase();
      const abstractLower = (paper.abstract || '').toLowerCase();

      // 40% keyword relevance (title weighted 2x abstract)
      const titleMatches = queryTerms.filter(t => titleLower.includes(t)).length;
      const abstractMatches = queryTerms.filter(t => abstractLower.includes(t)).length;
      const keywordScore = queryTerms.length > 0
        ? Math.min((titleMatches * 2 + abstractMatches) / (queryTerms.length * 3), 1)
        : 0.5;

      // 20% citation score (log scale)
      const citationScore = Math.log10((paper.citations || 0) + 1) / Math.log10(maxCitations + 1);

      // 20% recency (prefer last 10 years)
      const age = Math.max(0, currentYear - (paper.year || currentYear - 20));
      const recencyScore = Math.max(0, 1 - age / 20);

      // 10% completeness bonus
      const completeness = (paper.abstract ? 0.4 : 0) + (paper.pdfUrl ? 0.3 : 0) + (paper.doi ? 0.3 : 0);

      // 10% source priority
      const sourceBoost = (sourcePriority[paper.source?.toLowerCase() || ''] || 1) / 5;

      const relevanceScore = Math.round(
        keywordScore * 40 +
        citationScore * 20 +
        recencyScore * 20 +
        completeness * 10 +
        sourceBoost * 10
      );

      return { ...paper, relevanceScore };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  },

  // ─────────────────────────────────────────────────────────────
  // BUILT-IN PROVIDERS (OpenAlex, Semantic Scholar, Crossref, CORE)
  // ─────────────────────────────────────────────────────────────

  async fetchOpenAlex(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
    try {
      const res = await axios.get('https://api.openalex.org/works', {
        params: { search: query, per_page: Math.min(limit, 50), sort: 'relevance_score:desc' },
        timeout: FETCH_TIMEOUT,
        headers: { 'User-Agent': 'JurnalStar/1.0 (mailto:contact@jurnalstar.id)' },
      });

      const items = res.data?.results;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const id = item.id?.split('/')?.pop() || this.generateId();
        const title = (item.title || '').trim();
        if (!title) return null;

        return {
          id, paperId: id, source: 'openalex', title,
          abstract: this.decodeInvertedIndex(item.abstract_inverted_index),
          authors: (item.authorships || []).map((a: any) => ({ name: a.author?.display_name || 'Unknown' })),
          year: item.publication_year || 0,
          citations: item.cited_by_count || 0,
          doi: item.doi?.replace('https://doi.org/', '') || '',
          keywords: (item.keywords || []).map((k: any) => k.display_name || k).filter(Boolean),
          pdfUrl: item.open_access?.oa_url || '',
          externalUrl: item.doi ? `https://doi.org/${item.doi.replace('https://doi.org/', '')}` : item.id || '',
          url: item.doi ? `https://doi.org/${item.doi.replace('https://doi.org/', '')}` : item.id || '',
          relevanceScore: 0, isOpenAccess: !!item.open_access?.is_oa,
          venue: item.primary_location?.source?.display_name || '',
          docType: 'journal_article',
        };
      }).filter((p): p is UniversalPaperEnriched => p !== null && !!p.title);

    } catch (e: any) {
      console.error(`[PROVIDER] OpenAlex error: ${e.message}`);
      return [];
    }
  },

  async fetchSemanticScholar(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
    try {
      const headers: Record<string, string> = {};
      const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
      if (apiKey && apiKey !== 'your_key_here') headers['x-api-key'] = apiKey;

      const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params: {
          query, limit: Math.min(limit, 100),
          fields: 'title,abstract,authors,year,citationCount,externalIds,openAccessPdf,venue,isOpenAccess',
        },
        headers, timeout: FETCH_TIMEOUT,
      });

      const items = res.data?.data;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const title = (item.title || '').trim();
        if (!title) return null;
        const id = item.paperId || this.generateId();
        return {
          id, paperId: id, source: 'semantic', title,
          abstract: item.abstract || '',
          authors: (item.authors || []).map((a: any) => ({ name: a.name || 'Unknown' })),
          year: item.year || 0, citations: item.citationCount || 0,
          doi: item.externalIds?.DOI || '',
          keywords: [],
          pdfUrl: item.openAccessPdf?.url || '',
          externalUrl: `https://www.semanticscholar.org/paper/${id}`,
          url: `https://www.semanticscholar.org/paper/${id}`,
          relevanceScore: 0, isOpenAccess: !!item.isOpenAccess,
          venue: item.venue || '', docType: 'journal_article',
        };
      }).filter((p): p is UniversalPaperEnriched => p !== null && !!p.title);

    } catch (e: any) {
      console.error(`[PROVIDER] Semantic Scholar error: ${e.message}`);
      return [];
    }
  },

  async fetchCrossref(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
    try {
      const res = await axios.get('https://api.crossref.org/works', {
        params: {
          query, rows: Math.min(limit, 50),
          select: 'DOI,title,abstract,author,published,is-referenced-by-count,link,URL,container-title,type',
        },
        timeout: FETCH_TIMEOUT,
        headers: { 'User-Agent': 'JurnalStar/1.0 (mailto:contact@jurnalstar.id)' },
      });

      const items = res.data?.message?.items;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const title = (item.title?.[0] || '').trim();
        if (!title) return null;
        const doi = item.DOI || '';
        const id = doi || this.generateId();

        const typeMap: Record<string, string> = {
          'journal-article': 'journal_article',
          'proceedings-article': 'conference_paper',
          'dissertation': 'thesis',
          'review-article': 'review',
        };

        return {
          id, paperId: id, source: 'crossref', title,
          abstract: (item.abstract || '').replace(/<[^>]*>/g, '').trim(),
          authors: (item.author || []).map((a: any) => ({
            name: `${a.given || ''} ${a.family || ''}`.trim() || 'Unknown',
          })),
          year: item.published?.['date-parts']?.[0]?.[0] || 0,
          citations: item['is-referenced-by-count'] || 0,
          doi, keywords: [],
          pdfUrl: (item.link || []).find((l: any) => l['content-type'] === 'application/pdf')?.URL || '',
          externalUrl: doi ? `https://doi.org/${doi}` : item.URL || '',
          url: doi ? `https://doi.org/${doi}` : item.URL || '',
          relevanceScore: 0, isOpenAccess: false,
          venue: item['container-title']?.[0] || '',
          docType: (typeMap[item.type] || 'unknown') as any,
        };
      }).filter((p): p is UniversalPaperEnriched => p !== null && !!p.title);

    } catch (e: any) {
      console.error(`[PROVIDER] Crossref error: ${e.message}`);
      return [];
    }
  },

  async fetchCORE(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') return [];

    try {
      const res = await axios.get('https://api.core.ac.uk/v3/search/works', {
        params: { q: query, limit: Math.min(limit, 100) },
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: FETCH_TIMEOUT,
      });

      const items = res.data?.results;
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const title = (item.title || '').trim();
        if (!title) return null;
        const id = item.id?.toString() || this.generateId();

        return {
          id: `core_${id}`, paperId: `core_${id}`, source: 'core', title,
          abstract: item.abstract || '',
          authors: (item.authors || []).map((a: any) => ({ name: a.name || 'Unknown' })),
          year: item.yearPublished || 0, citations: 0,
          doi: item.doi || '', keywords: (item.subjects || []).filter(Boolean),
          pdfUrl: item.downloadUrl || '',
          externalUrl: `https://core.ac.uk/works/${id}`,
          url: `https://core.ac.uk/works/${id}`,
          relevanceScore: 0, isOpenAccess: true,
          venue: item.journals?.[0]?.title || '', docType: 'journal_article',
        };
      }).filter((p): p is UniversalPaperEnriched => p !== null && !!p.title);

    } catch (e: any) {
      console.error(`[PROVIDER] CORE error: ${e.message}`);
      return [];
    }
  },

  generateId(): string {
    return `jrn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  decodeInvertedIndex(index: any): string {
    try {
      if (!index || typeof index !== 'object') return '';
      const words: string[] = [];
      for (const [word, positions] of Object.entries(index)) {
        if (Array.isArray(positions)) {
          for (const pos of positions as number[]) words[pos] = word;
        }
      }
      return words.filter(Boolean).join(' ');
    } catch { return ''; }
  },
};
