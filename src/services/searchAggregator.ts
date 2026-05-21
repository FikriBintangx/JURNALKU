import axios from 'axios';
import { fetchArxiv } from './providers/arxivProvider';
import { fetchPubMed } from './providers/pubmedProvider';
import { fetchDOAJ } from './providers/doajProvider';
import { fetchZenodo } from './providers/zenodoProvider';
import { fetchGoogleScholar } from './providers/googleScholarProvider';
import { fetchLens } from './providers/lensProvider';
import { fetchBASE } from './providers/baseProvider';
import { fetchGaruda } from './providers/garudaProvider';
import type { UniversalPaperEnriched } from '@/types/search';
import { intelligenceService, ResearchIntelligence } from './intelligenceService';
import { cohereService } from './cohereService';
import { healthSystem, ProviderStatus } from '../lib/reliability/health';
import { searchQueue } from '../lib/reliability/queue';
import { reliabilityCache } from '../lib/reliability/cache';

// Re-export for compatibility with existing imports
export type UniversalPaper = UniversalPaperEnriched;

const DEFAULT_TIMEOUT = 10000;
const FETCH_TIMEOUT = 12000;
const PROVIDER_TIERS = {
  TIER_1: ['googlescholar', 'semantic', 'openalex'],
  TIER_2: ['crossref', 'core', 'pubmed', 'arxiv'],
  TIER_3: ['base', 'zenodo', 'doaj', 'garuda', 'lens']
};

function withTimeout<T>(promise: Promise<T>, ms: number, provider: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`[${provider}] Timeout after ${ms}ms`)), ms)
    )
  ]);
}

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

  /**
   * PART 1 — QUERY NORMALIZATION
   * Ensures 'esport' becomes 'esports' and other academic mappings.
   */
  normalizeAcademicQuery(query: string): string {
    const q = query.toLowerCase().trim();
    const dictionary: Record<string, string> = {
      'esport': 'esports',
      'e-sport': 'esports',
      'crypto': 'cryptocurrency',
      'blockchain': 'distributed ledger technology',
      'ai': 'artificial intelligence',
      'ml': 'machine learning',
      'iot': 'internet of things',
      'ekonomi': 'economics',
      'hukum': 'law',
      'pembelajaran': 'learning education',
      'kesehatan': 'medical health',
    };

    // Exact match or contains mapping
    if (dictionary[q]) return dictionary[q];
    
    // Check if any word in the query matches a dictionary key
    const words = q.split(/\s+/);
    const normalizedWords = words.map(w => dictionary[w] || w);
    return normalizedWords.join(' ');
  },

  /**
   * PART 6 & 7 — SEMANTIC INTELLIGENCE ENGINE
   */
  async expandAcademicQuery(query: string): Promise<string[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const expansions: Set<string> = new Set([query]);

    // Manual Rule-based expansion for common domains (Mocking a vector-based expansion)
    const dictionary: Record<string, string[]> = {
      'esport': ['e-sports', 'electronic sports', 'competitive gaming', 'gaming performance'],
      'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
      'covid': ['sars-cov-2', 'coronavirus', 'pandemic', 'respiratory virus'],
      'ekonomi': ['economy', 'economic', 'finance', 'market trends', 'macroeconomics'],
      'pembelajaran': ['learning', 'education', 'pedagogy', 'instructional design'],
      'hukum': ['law', 'legal', 'jurisprudence', 'regulation', 'judicial'],
    };

    terms.forEach(term => {
      Object.keys(dictionary).forEach(key => {
        if (term.includes(key)) {
          dictionary[key].forEach(val => expansions.add(val));
        }
      });
    });

    return Array.from(expansions);
  },

  compressSearchQuery(query: string): string {
    return this.compressAcademicQuery(query);
  },

  detectIntent(query: string): { topic: string, domain: string, intent: string } {
    const q = query.toLowerCase();
    let intent = 'discovery';
    if (q.includes('metode') || q.includes('method')) intent = 'methodology';
    if (q.includes('banding') || q.includes('compare')) intent = 'comparative';
    if (q.includes('statistik') || q.includes('data')) intent = 'empirical';

    // Simple domain detection
    let domain = 'general';
    if (q.includes('medis') || q.includes('health') || q.includes('pasien')) domain = 'medical';
    if (q.includes('komputer') || q.includes('software') || q.includes('digital')) domain = 'technology';

    return { topic: query, domain, intent };
  },

  compressAcademicQuery(query: string): string {
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'about', 'terhadap', 'dalam', 'di', 'era', 'terutama', 'untuk', 'pengaruh', 'dan', 'yang', 'dari']);
    return query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word))
      .slice(0, 6)
      .join(' ');
  },

  detectDOI(query: string): string | null {
    if (!query) return null;
    const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
    const match = query.match(doiRegex);
    return match ? match[1] : null;
  },

  /**
   * Main search entry point — Uses Waterfall Priority Architecture.
   */
  async search(rawQuery: string, limit: number = 20, offset: number = 0, filters?: any, provider: string = 'default'): Promise<{ 
    results: UniversalPaperEnriched[], 
    total?: number,
    message?: string,
    intelligence?: ResearchIntelligence,
    debug?: any
  }> {
    const query = this.sanitizeQuery(rawQuery);
    if (!query) return { results: [] };

    const cacheKey = reliabilityCache.generateKey('search', { query, limit, offset, filters, provider });
    const cached = reliabilityCache.get<any>(cacheKey);
    if (cached) {
      console.log(`[SEARCH_ENGINE] Cache hit for: ${query}`);
      return cached;
    }

    const t0 = Date.now();
    const providerDebug: Record<string, string> = {};
    
    // PART 1: Normalize
    const normalizedQuery = this.normalizeAcademicQuery(query);
    const compressedQuery = this.compressSearchQuery(normalizedQuery);
    
    console.log(`[SEARCH_ENGINE] Researching: "${query}" -> Normalized: "${normalizedQuery}"`);

    // Detect if it's a DOI search
    const doi = this.detectDOI(query);
    if (doi) {
      const results = await this.executeTier(['crossref', 'openalex', 'semantic'], doi, 1, 0, filters, providerDebug);
      if (results.length > 0) return { results: this.deduplicate(results), debug: providerDebug };
    }

    // 1. Initial Intelligence & Intent
    const queryIntel = await intelligenceService.analyzeQuery(normalizedQuery);
    const intent = this.detectIntent(normalizedQuery);
    let allPapers: UniversalPaperEnriched[] = [];

    // 2. TIERED WATERFALL EXECUTION
    // If it's a specific domain, prioritize providers
    let tiers = [...PROVIDER_TIERS.TIER_1];
    if (intent.domain === 'technology') {
      // Prioritize IEEE/ACM style providers (Semantic, OpenAlex often better here than generic Crossref)
      tiers = ['semantic', 'openalex', 'googlescholar'];
    }

    const t1Results = await this.executeTier(tiers, compressedQuery, limit, offset, filters, providerDebug);
    allPapers.push(...t1Results);

    // 3. ADAPTIVE RECOVERY (If sparse)
    if (allPapers.length < 3) {
      console.log(`[SEARCH_ENGINE] Result sparse. Triggering Adaptive Recovery...`);
      const expandedTerms = await this.expandAcademicQuery(normalizedQuery);
      
      // Try next term in expansion
      for (const variant of expandedTerms.slice(1, 4)) {
        if (allPapers.length >= 10) break;
        console.log(`[RECOVERY] Trying variant: ${variant}`);
        const variantResults = await this.executeTier(PROVIDER_TIERS.TIER_1, variant, limit, offset, filters, providerDebug);
        allPapers.push(...variantResults);
      }
    }

    // Tier 2: Essential
    if (allPapers.length < limit) {
        const t2Results = await this.executeTier(PROVIDER_TIERS.TIER_2, compressedQuery, limit, offset, filters, providerDebug);
        allPapers.push(...t2Results);
    }

    // 3. Deduplication & Scoring
    const uniquePapers = this.deduplicate(allPapers);
    let ranked = this.rankResults(uniquePapers, normalizedQuery, queryIntel);
    
    // 4. Neural Semantic Reranking (Cohere API)
    if (ranked.length > 0) {
        try {
            const docsToRerank = Math.min(ranked.length, limit * 2);
            const docTexts = ranked.slice(0, docsToRerank).map(p => `${p.title} ${p.abstract || ''}`.trim());
            const rerankScores = await cohereService.rerankDocuments(normalizedQuery, docTexts, docsToRerank);
            
            if (rerankScores && rerankScores.length > 0) {
                const newlyRanked: UniversalPaperEnriched[] = [];
                for (const r of rerankScores) {
                    const originalItem = ranked[r.index];
                    if (originalItem) {
                        originalItem.relevanceScore = (originalItem.relevanceScore || 0) + (r.relevance_score * 40);
                        newlyRanked.push(originalItem);
                    }
                }
                
                const includedIds = new Set(newlyRanked.map(p => p.id));
                const remaining = ranked.filter(p => !includedIds.has(p.id));
                ranked = [...newlyRanked, ...remaining];
            }
        } catch (error) {
            console.error("[SEARCH_ENGINE] Semantic Reranking failed, falling back to heuristics.", error);
        }
    }

    const finalResults = ranked.slice(0, limit);

    const final = { 
      results: finalResults, 
      total: uniquePapers.length, // Approximate total from current discovery
      message: finalResults.length === 0 ? "Neural Signal Weak: No research clusters found for this query." : undefined,
      intelligence: queryIntel,
      debug: providerDebug
    };
    
    reliabilityCache.set(cacheKey, final, 3600);
    console.log(`[SEARCH_ENGINE] Finished in ${Date.now() - t0}ms. Found: ${finalResults.length}`);
    return final;
  },

  async executeTier(providers: string[], query: string, limit: number, offset: number, filters: any, debug: Record<string, string>): Promise<UniversalPaperEnriched[]> {
    const results = await Promise.allSettled(
      providers.map(p => this.safeFetch(p, query, limit, offset, filters))
    );

    const papers: UniversalPaperEnriched[] = [];
    results.forEach((res, i) => {
      const providerName = providers[i];
      if (res.status === 'fulfilled') {
        const count = res.value.length;
        debug[providerName] = count > 0 ? `OK (${count})` : "EMPTY";
        papers.push(...res.value);
      } else {
        debug[providerName] = `ERROR: ${res.reason?.message || 'Unknown'}`;
      }
    });
    return papers;
  },

  async safeFetch(provider: string, query: string, limit: number, offset: number, filters?: any): Promise<UniversalPaperEnriched[]> {
    if (healthSystem.getStatus(provider) === ProviderStatus.DOWN || healthSystem.getStatus(provider) === ProviderStatus.COOLDOWN) {
        return [];
    }

    return await searchQueue<UniversalPaperEnriched[]>(async () => {
      try {
        let fetchFn: any;
        let timeout = DEFAULT_TIMEOUT;

        switch (provider) {
          case 'openalex': fetchFn = () => this.fetchOpenAlex(query, limit, offset, filters); timeout = 12000; break;
          case 'semantic': fetchFn = () => this.fetchSemanticScholar(query, limit, offset, filters); timeout = 8000; break;
          case 'crossref': fetchFn = () => this.fetchCrossref(query, limit, offset, filters); timeout = 10000; break;
          case 'googlescholar': fetchFn = () => fetchGoogleScholar(query, limit, offset); timeout = 15000; break;
          case 'core': fetchFn = () => this.fetchCORE(query, limit, filters); timeout = 10000; break;
          case 'pubmed': fetchFn = () => fetchPubMed(query, limit); break;
          case 'arxiv': fetchFn = () => fetchArxiv(query, limit); break;
          case 'doaj': fetchFn = () => fetchDOAJ(query, limit); break;
          case 'zenodo': fetchFn = () => fetchZenodo(query, limit); break;
          case 'base': fetchFn = () => fetchBASE(query, limit); break;
          case 'garuda': fetchFn = () => fetchGaruda(query, limit); break;
          case 'lens': fetchFn = () => fetchLens(query, limit); break;
          default: return [];
        }

        const data = await withTimeout(fetchFn(), timeout, provider);
        healthSystem.reportSuccess(provider);
        return data || [];
      } catch (e: any) {
        healthSystem.reportFailure(provider, e);
        console.error(`[PROVIDER] ${provider} failed: ${e.message}`);
        return [];
      }
    });
  },

  isValidPaper(paper: any): boolean {
    // PART 3 — RELAX FILTERING
    // Minimum valid result: title exists and has reasonable length.
    // DO NOT require abstract, DOI, or PDF at this stage.
    return !!(paper && paper.title && typeof paper.title === 'string' && paper.title.trim().length > 5);
  },

  deduplicate(papers: UniversalPaperEnriched[]): UniversalPaperEnriched[] {
    const seenDOI = new Set<string>();
    const seenTitle = new Set<string>();
    
    return papers.filter(paper => {
      if (!paper || !paper.title) return false;

      // 1. Check DOI (strongest unique ID)
      const doi = (paper.doi || '').toLowerCase().trim();
      if (doi && doi.length > 5) {
        if (seenDOI.has(doi)) return false;
        seenDOI.add(doi);
        return true;
      }

      // 2. Check Title (Fuzzy matching)
      // Normalize: lowercase, remove special chars, remove double spaces
      const normalizedTitle = paper.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Use a prefix of the title to catch minor variations
      const titleHash = normalizedTitle.slice(0, 100);
      
      if (seenTitle.has(titleHash)) return false;
      seenTitle.add(titleHash);
      
      return true;
    });
  },

  removeDuplicatePapers(oldResults: UniversalPaperEnriched[], newResults: UniversalPaperEnriched[]): UniversalPaperEnriched[] {
    const existingIds = new Set(oldResults.map(p => p.paperId).filter(Boolean));
    const existingDOIs = new Set(oldResults.map(p => (p.doi || '').toLowerCase().trim()).filter(Boolean));
    const existingTitles = new Set(oldResults.map(p => 
      (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100)
    ).filter(Boolean));

    return newResults.filter(paper => {
      if (paper.paperId && existingIds.has(paper.paperId)) return false;
      
      const doi = (paper.doi || '').toLowerCase().trim();
      if (doi && existingDOIs.has(doi)) return false;

      const title = (paper.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
      if (title && existingTitles.has(title)) return false;

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

  async enrichWithDirectPdfs(papers: UniversalPaperEnriched[]): Promise<UniversalPaperEnriched[]> {
    return await Promise.all(papers.map(async (paper) => {
      // If we already have a PDF or no DOI, skip
      if (paper.pdfUrl || !paper.doi) return paper;

      try {
        // Unpaywall is the best for finding legal open access PDFs
        const res = await axios.get(`https://api.unpaywall.org/v2/${paper.doi}`, {
          params: { email: 'contact@jurnalstar.id' },
          timeout: 3000 // Fast timeout
        });

        const bestLocation = res.data?.best_oa_location;
        if (bestLocation?.url_for_pdf) {
          return { ...paper, pdfUrl: bestLocation.url_for_pdf, isOpenAccess: true };
        }
      } catch (e) {
        // Silent fail for PDF enrichment
      }
      return paper;
    }));
  },

  async fetchOpenAlex(query: string, limit: number, offset: number = 0, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const params: any = { 
        search: query, 
        per_page: Math.min(limit, 50), 
        offset,
        // Remove explicit sort if it causes issues with relevance searches
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
        headers: { 
          'User-Agent': 'JurnalStar/1.0 (mailto:contact@jurnalstar.id)',
          'Accept': 'application/json'
        },
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

  async fetchSemanticScholar(query: string, limit: number, offset: number = 0, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const headers: Record<string, string> = {};
      const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
      if (apiKey && apiKey !== 'your_key_here') headers['x-api-key'] = apiKey;

      const params: any = {
        query, limit: Math.min(limit, 100), offset,
        fields: 'title,abstract,authors,year,citationCount,externalIds,openAccessPdf,venue,isOpenAccess',
      };

      if (filters?.yearStart || filters?.yearEnd) {
        if (filters.yearStart === filters.yearEnd && filters.yearStart) {
          params.year = `${filters.yearStart}`;
        } else {
          params.year = `${filters.yearStart || 1900}-${filters.yearEnd || new Date().getFullYear()}`;
        }
      }

      // Simple delay to mitigate 429 in rapid succession if needed
      // but usually the aggregator already uses a queue.
      const res = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
        params,
        headers, 
        timeout: FETCH_TIMEOUT,
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

  async fetchCrossref(query: string, limit: number, offset: number = 0, filters?: any): Promise<UniversalPaperEnriched[]> {
    try {
      const params: any = {
        query, rows: Math.min(limit, 50),
        offset,
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