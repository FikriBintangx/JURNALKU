import axios from 'axios';
import { fetchArxiv } from './providers/arxivProvider';
import { fetchPubMed } from './providers/pubmedProvider';
import { fetchDOAJ } from './providers/doajProvider';
import { fetchZenodo } from './providers/zenodoProvider';
import type { UniversalPaperEnriched } from '@/types/search';
import { intelligenceService, ResearchIntelligence } from './intelligenceService';

// Re-export for compatibility with existing imports
export type UniversalPaper = UniversalPaperEnriched;

const FETCH_TIMEOUT = 7000;

// ─────────────────────────────────────────────────────────────
// Query expansions — when results are sparse
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

  detectDOI(query: string): string | null {
    if (!query) return null;
    // Regex for DOI (Standard: 10.xxxx/yyyy)
    const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
    const match = query.match(doiRegex);
    return match ? match[1] : null;
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
   * Auto-retries with AI-driven expansions if results are sparse.
   */
  async search(rawQuery: string, limit: number = 20, filters?: any): Promise<{ results: UniversalPaperEnriched[], intelligence?: ResearchIntelligence }> {
    const query = this.sanitizeQuery(rawQuery);
    if (!query) {
      console.warn("[SEARCH] Empty query.");
      return { results: [] };
    }

    const t0 = Date.now();
    console.log(`[INTELLIGENCE] Initializing Research Engine: "${query}"`);

    // Detect if it's a DOI search
    const doi = this.detectDOI(query);
    if (doi) {
      console.log(`[INTELLIGENCE] DOI detected: ${doi}. Performing targeted lookup.`);
      // If DOI, we only need targeted fetch from Crossref/OpenAlex/Semantic
      const results = await Promise.allSettled([
        this.fetchCrossref(doi, 1, filters),
        this.fetchOpenAlex(doi, 1, filters),
        this.fetchSemanticScholar(doi, 1, filters)
      ]);
      
      const papers: UniversalPaperEnriched[] = [];
      results.forEach(res => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          papers.push(...res.value);
        }
      });

      if (papers.length > 0) {
        const final = this.deduplicate(papers);
        return { results: final };
      }
      // If DOI lookup fails, fallback to normal search
    }

    // 1. Parallel Intelligence & Initial Fetch
    const [queryIntel, initialPapers] = await Promise.all([
      intelligenceService.analyzeQuery(query),
      this.runParallelFetch(query, limit, filters)
    ]);

    let papers = initialPapers;

    console.log(`[INTELLIGENCE] Intent: ${queryIntel.intent}, Domains: ${queryIntel.domains.join(', ')}`);

    // 2. Semantic Expansion (AI-Driven)
    if (papers.length < 10 && queryIntel.keywords.length > 0) {
      const expansionQuery = queryIntel.keywords.slice(0, 2).join(' ');
      console.log(`[INTELLIGENCE] Sparse results. Triggering semantic expansion: "${expansionQuery}"`);
      const extra = await this.runParallelFetch(expansionQuery, limit, filters);
      papers = this.deduplicate([...papers, ...extra]);
    }

    // 3. Fallback to basic expansion if still sparse
    if (papers.length < 5) {
      const basicExpansions = this.expandQuery(query);
      if (basicExpansions.length > 0) {
        const extra = await this.runParallelFetch(basicExpansions[0], limit, filters);
        papers = this.deduplicate([...papers, ...extra]);
      }
    }

    // 4. Advanced Intelligence Ranking (ARIS)
    const ranked = this.rankResults(papers, query, queryIntel);
    const final = ranked.slice(0, limit);

    console.log(`[INTELLIGENCE] Pipeline Complete: ${papers.length} raw → ${ranked.length} unique → ${final.length} returned in ${Date.now() - t0}ms`);
    return { results: final, intelligence: queryIntel };
  },

  async runParallelFetch(query: string, limit: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    const perSource = Math.ceil(limit / 3);

    const results = await Promise.allSettled([
      this.fetchOpenAlex(query, perSource, filters),
      this.fetchCORE(query, perSource, filters),
      this.fetchCrossref(query, perSource, filters),
      this.fetchSemanticScholar(query, perSource, filters),
      fetchArxiv(query, perSource),
      fetchPubMed(query, Math.ceil(perSource / 2)),
      fetchDOAJ(query, Math.ceil(perSource / 2)),
      fetchZenodo(query, Math.ceil(perSource / 2)),
    ]);

    const providerNames = ['OpenAlex', 'CORE', 'Crossref', 'Semantic Scholar', 'arXiv', 'PubMed', 'DOAJ', 'Zenodo'];
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
    return !!(paper && paper.id && paper.title && typeof paper.title === 'string' && paper.title.trim().length > 3);
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

  rankResults(papers: UniversalPaperEnriched[], query: string, queryIntel?: ResearchIntelligence): UniversalPaperEnriched[] {
    const deduped = this.deduplicate(papers);
    const currentYear = new Date().getFullYear();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const maxCitations = Math.max(...deduped.map(p => p.citations || 0), 1);

    const sourcePriority: Record<string, number> = {
      openalex: 5, crossref: 4, semantic: 4, core: 3,
      pubmed: 3, arxiv: 3, doaj: 2, zenodo: 2,
    };

    return deduped.map(paper => {
      const titleLower  = (paper.title    || '').toLowerCase();
      const abstractLower = (paper.abstract || '').toLowerCase();
      const paperYear   = paper.year || (currentYear - 10);
      const age         = Math.max(0, currentYear - paperYear);
      const citations   = paper.citations || 0;

      // ── 1. Keyword Relevance (0–30) ─────────────────────────────────────
      const titleMatches    = queryTerms.filter(t => titleLower.includes(t)).length;
      const abstractMatches = queryTerms.filter(t => abstractLower.includes(t)).length;
      const baseScore = queryTerms.length > 0
        ? Math.min((titleMatches * 2.5 + abstractMatches) / (queryTerms.length * 3.5), 1) * 30
        : 15;

      // ── 2. IRIS Intelligence Score (0–25) ───────────────────────────────
      const intelligenceScore = queryIntel
        ? Math.min(intelligenceService.calculateIRIS(paper, queryIntel) * 0.25, 25)
        : Math.min((Math.log10(citations + 1) / Math.log10(maxCitations + 1)) * 20, 20);

      // ── 3. Recency Boost — Tiered (0–30) ────────────────────────────────
      // This is the primary lever for "newest first" ranking
      let recencyScore: number;
      if      (age === 0)  recencyScore = 30;   // Current year — maximum boost
      else if (age === 1)  recencyScore = 26;   // Last year
      else if (age <= 3)   recencyScore = 20;   // 2–3 years old
      else if (age <= 5)   recencyScore = 13;   // 4–5 years old
      else if (age <= 10)  recencyScore = 7;    // 6–10 years old
      else                 recencyScore = Math.max(0, 4 - (age - 10) * 0.3); // Older: decays to 0

      // Seminal exception: very highly cited old papers get an authority bonus
      // (preserves foundational works without letting them dominate fresh results)
      const isSeminal = citations >= 500 && age > 10;
      if (isSeminal) recencyScore = Math.max(recencyScore, 10);

      // ── 4. Citation Velocity — Trend Score (0–10) ───────────────────────
      // Fast-growing papers outrank static high-citation ones
      const velocity = citations / Math.max(1, age);
      const velocityScore = Math.min(Math.log10(velocity + 1) * 5, 10);

      // ── 5. Source Authority (0–5) ────────────────────────────────────────
      const sourceBoost = (sourcePriority[paper.source?.toLowerCase() || ''] || 1) * 1;

      // ── Final Composite Score ────────────────────────────────────────────
      // Weights: Relevance 30% | Intelligence 25% | Recency 30% | Velocity 10% | Source 5%
      const relevanceScore = Math.min(
        Math.round(baseScore + intelligenceScore + recencyScore + velocityScore + sourceBoost),
        100
      );

      const trendScore = velocity;

      // ── Badge Signals ────────────────────────────────────────────────────
      const isNew     = age <= 1;                           // Current or last year
      const isRising  = velocity >= 15 && age <= 5;        // High velocity + recent
      const isTrending = (paper.trendScore || trendScore) > 10;

      return { ...paper, relevanceScore, trendScore, isNew, isRising, isTrending };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  },

  async fetchOpenAlex(query: string, limit: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const params: any = { 
        search: query, 
        per_page: Math.min(limit, 50), 
        sort: 'relevance_score:desc' 
      };

      if (filters?.yearStart || filters?.yearEnd) {
        let filterStr = '';
        if (filters.yearStart === filters.yearEnd && filters.yearStart) {
          filterStr = `publication_year:${filters.yearStart}`;
        } else {
          if (filters.yearStart) filterStr += `publication_year:>${filters.yearStart - 1}`;
          if (filters.yearEnd) filterStr += (filterStr ? ',' : '') + `publication_year:<${filters.yearEnd + 1}`;
        }
        if (filterStr) params.filter = filterStr;
      }

      const res = await axios.get('https://api.openalex.org/works', {
        params,
        timeout: FETCH_TIMEOUT,
        headers: { 'User-Agent': 'JurnalStar/1.0 (mailto:contact@jurnalstar.id)' },
      });

      const items = res.data?.results;
      if (!Array.isArray(items)) return [];

      return items.reduce((acc: UniversalPaperEnriched[], item: any) => {
        const id = item.id?.split('/')?.pop() || this.generateId();
        const title = (item.title || '').trim();
        if (!title) return acc;

        acc.push({
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
        });
        return acc;
      }, []);

    } catch (e: any) {
      console.error(`[PROVIDER] OpenAlex error: ${e.message}`);
      return [];
    }
  },

  async fetchSemanticScholar(query: string, limit: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const headers: Record<string, string> = {};
      const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
      if (apiKey && apiKey !== 'your_key_here') headers['x-api-key'] = apiKey;

      const params: any = {
        query, limit: Math.min(limit, 100),
        fields: 'title,abstract,authors,year,citationCount,externalIds,openAccessPdf,venue,isOpenAccess',
      };

      if (filters?.yearStart || filters?.yearEnd) {
        if (filters.yearStart === filters.yearEnd && filters.yearStart) {
          params.year = `${filters.yearStart}`;
        } else {
          params.year = `${filters.yearStart || 1900}-${filters.yearEnd || new Date().getFullYear()}`;
        }
      }

      const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params,
        headers, timeout: FETCH_TIMEOUT,
      });

      const items = res.data?.data;
      if (!Array.isArray(items)) return [];

      return items.reduce((acc: UniversalPaperEnriched[], item: any) => {
        const title = (item.title || '').trim();
        if (!title) return acc;
        const id = item.paperId || this.generateId();
        acc.push({
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
        });
        return acc;
      }, []);

    } catch (e: any) {
      console.error(`[PROVIDER] Semantic Scholar error: ${e.message}`);
      return [];
    }
  },

  async fetchCrossref(query: string, limit: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const params: any = {
        query, rows: Math.min(limit, 50),
        select: 'DOI,title,abstract,author,published,is-referenced-by-count,link,URL,container-title,type',
      };

      if (filters?.yearStart || filters?.yearEnd) {
        let filterStr = '';
        if (filters.yearStart) filterStr += `from-pub-date:${filters.yearStart}-01-01`;
        if (filters.yearEnd) filterStr += (filterStr ? ',' : '') + `until-pub-date:${filters.yearEnd}-12-31`;
        if (filterStr) params.filter = filterStr;
      }

      const res = await axios.get('https://api.crossref.org/works', {
        params,
        timeout: FETCH_TIMEOUT,
        headers: { 'User-Agent': 'JurnalStar/1.0 (mailto:contact@jurnalstar.id)' },
      });

      const items = res.data?.message?.items;
      if (!Array.isArray(items)) return [];

      return items.reduce((acc: UniversalPaperEnriched[], item: any) => {
        const title = (item.title?.[0] || '').trim();
        if (!title) return acc;
        const doi = item.DOI || '';
        const id = doi || this.generateId();

        const typeMap: Record<string, string> = {
          'journal-article': 'journal_article',
          'proceedings-article': 'conference_paper',
          'dissertation': 'thesis',
          'review-article': 'review',
        };

        acc.push({
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
        });
        return acc;
      }, []);

    } catch (e: any) {
      console.error(`[PROVIDER] Crossref error: ${e.message}`);
      return [];
    }
  },

  async fetchCORE(query: string, limit: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') return [];

    try {
      const q = filters?.yearStart ? `${query} AND yearPublished>=${filters.yearStart}` : query;
      const res = await axios.get('https://api.core.ac.uk/v3/search/works', {
        params: { q, limit: Math.min(limit, 100) },
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: FETCH_TIMEOUT,
      });

      const items = res.data?.results;
      if (!Array.isArray(items)) return [];

      return items.reduce((acc: UniversalPaperEnriched[], item: any) => {
        const title = (item.title || '').trim();
        if (!title) return acc;
        const id = item.id?.toString() || this.generateId();

        acc.push({
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
        });
        return acc;
      }, []);

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