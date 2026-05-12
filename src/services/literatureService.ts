/**
 * ISAGI LITERATURE INTELLIGENCE SERVICE
 * 
 * Production-grade retriever for real academic data.
 * Connects to Crossref, OpenAlex, and SemanticScholar to fetch live paper context.
 */

export interface AcademicPaper {
  id: string;
  doi?: string;
  title: string;
  authors: string[];
  year?: number;
  abstract?: string;
  citationCount?: number;
  concepts?: string[];
  url?: string;
  source: 'crossref' | 'openalex' | 'semanticscholar' | 'local';
}

class LiteratureIntelligenceService {
  private static instance: LiteratureIntelligenceService;
  private cache: Map<string, AcademicPaper[]> = new Map();

  private constructor() {}

  public static getInstance(): LiteratureIntelligenceService {
    if (!LiteratureIntelligenceService.instance) {
      LiteratureIntelligenceService.instance = new LiteratureIntelligenceService();
    }
    return LiteratureIntelligenceService.instance;
  }

  /**
   * SEARCH PAPERS
   * Retrieves papers from multiple real-world academic sources.
   */
  public async search(query: string, limit: number = 5): Promise<AcademicPaper[]> {
    const cacheKey = `search:${query}:${limit}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    console.log(`[LITERATURE] Real-time search for: "${query}"`);
    
    try {
      // Parallel retrieval from multiple providers
      const [openAlexResults, crossrefResults] = await Promise.all([
        this.fetchOpenAlex(query, limit),
        this.fetchCrossref(query, limit)
      ]);

      const merged = this.mergeAndRank([...openAlexResults, ...crossrefResults]);
      this.cache.set(cacheKey, merged);
      return merged;
    } catch (error) {
      console.error('[LITERATURE] Search failed:', error);
      return [];
    }
  }

  /**
   * OPENALEX RETRIEVAL
   */
  private async fetchOpenAlex(query: string, limit: number): Promise<AcademicPaper[]> {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}`;
      const response = await fetch(url, { headers: { 'User-Agent': 'ISAGI-Research-Engine/1.0 (mailto:admin@jurnalstar.id)' } });
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.results || []).map((work: any) => ({
        id: work.id,
        doi: work.doi?.replace('https://doi.org/', ''),
        title: work.title,
        authors: (work.authorships || []).map((a: any) => a.author?.display_name),
        year: work.publication_year,
        abstract: '', // OpenAlex abstract is inverted index, needs processing
        citationCount: work.cited_by_count,
        concepts: (work.concepts || []).map((c: any) => c.display_name),
        url: work.doi || work.id,
        source: 'openalex'
      }));
    } catch (e) { return []; }
  }

  /**
   * CROSSREF RETRIEVAL
   */
  private async fetchCrossref(query: string, limit: number): Promise<AcademicPaper[]> {
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.message?.items || []).map((item: any) => ({
        id: item.DOI || item.URL,
        doi: item.DOI,
        title: (item.title || [])[0] || 'Untitled',
        authors: (item.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()),
        year: item.issued?.['date-parts']?.[0]?.[0],
        abstract: item.abstract?.replace(/<[^>]*>/g, ''),
        citationCount: item['is-referenced-by-count'] || 0,
        url: `https://doi.org/${item.DOI}`,
        source: 'crossref'
      }));
    } catch (e) { return []; }
  }

  /**
   * MERGE & RANK
   * Dedupes by DOI and ranks by citation count/relevance
   */
  private mergeAndRank(papers: AcademicPaper[]): AcademicPaper[] {
    const seen = new Set<string>();
    const unique: AcademicPaper[] = [];

    for (const p of papers) {
      const key = p.doi || p.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }

    return unique.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
  }

  /**
   * GET CONTEXT FOR AI
   * Formats retrieved papers into a clean context string for the LLM.
   */
  public formatContext(papers: AcademicPaper[]): string {
    if (papers.length === 0) return "Tidak ada data paper eksternal yang ditemukan.";
    
    return papers.map((p, i) => {
      return `[${i+1}] "${p.title}" (${p.year || 'N/A'}). DOI: ${p.doi || 'N/A'}. Sitasi: ${p.citationCount || 0}. Authors: ${p.authors.slice(0, 3).join(', ')}.`;
    }).join('\n');
  }
}

export const literatureService = LiteratureIntelligenceService.getInstance();
