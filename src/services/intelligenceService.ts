import { geminiService } from "./geminiService";
import { UniversalPaperEnriched } from "@/types/search";

export interface ResearchIntelligence {
  intent: 'exploratory' | 'methodological' | 'review' | 'comparative' | 'generic';
  domains: string[];
  keywords: string[];
  questions: string[];
  summary?: string;
  conflicts?: ResearchConflict[];
}

export interface ResearchConflict {
  paperA: string;
  paperB: string;
  topic: string;
  type: 'contradictory' | 'supporting' | 'divergent';
  description: string;
}

/**
 * ISAGI Intelligence Service — Powers semantic search, ranking, and concept expansion
 */
export const intelligenceService = {
  /**
   * Analyze user query to understand research intent and expand concepts
   */
  async analyzeQuery(query: string): Promise<ResearchIntelligence> {
    try {
      // In a real high-perf system, we'd use a lightweight local model or embeddings
      // Here we leverage Gemini for high-quality semantic understanding
      const prompt = `Analyze this research query: "${query}"
      
      Your goal is to provide SEMANTIC EXPANSION for academic search.
      If the query is in Indonesian, provide the most precise Academic English equivalent terms.
      Example: "dampak tiktok shop terhadap umkm" -> "social commerce impact on small medium enterprises digital transformation".
      
      Return a JSON object with:
      - intent: (exploratory/methodological/review/comparative/generic)
      - domains: (up to 3 academic fields)
      - keywords: (8-12 hyper-relevant academic keywords, prioritize precise English academic terms)
      - questions: (3 research questions this query implies)
      
      Strict JSON format only.`;

      const response = await geminiService.generateAI({
        paperId: 'query-analysis',
        type: 'intelligence',
        prompt,
        title: query
      });

      if (response && response.data) {
        // More robust JSON extraction — handles markdown blocks and conversational noise
        let jsonStr = response.data.trim();
        
        // Strip markdown code blocks if present
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/) || jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        } else {
          // If no markdown blocks, try to find the first '{' and last '}'
          const start = jsonStr.indexOf('{');
          const end = jsonStr.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            jsonStr = jsonStr.substring(start, end + 1);
          }
        }
        
        try {
          return JSON.parse(jsonStr);
        } catch (parseErr) {
          console.warn("[INTELLIGENCE] Failed to parse extracted JSON, raw response was:", response.data.slice(0, 100));
          throw parseErr;
        }
      }
    } catch (e) {
      console.warn("[INTELLIGENCE] Query analysis failed, using fallback:", (e as Error).message);
    }

    return {
      intent: 'generic',
      domains: ['Multidisciplinary'],
      keywords: [query],
      questions: [`What are the latest findings regarding ${query}?`]
    };
  },

  /**
   * Calculate ISAGI Research Intelligence Score (IRIS)
   */
  calculateIRIS(paper: UniversalPaperEnriched, queryIntel: ResearchIntelligence): number {
    let score = 0;
    const currentYear = new Date().getFullYear();
    
    // 1. Semantic Domain Alignment (15%)
    const domains = queryIntel.domains.map(d => d.toLowerCase());
    const paperVenue = (paper.venue || '').toLowerCase();
    const paperTitle = (paper.title  || '').toLowerCase();
    const textToSearch = `${paperTitle} ${paper.abstract}`.toLowerCase();
    
    const domainMatch = domains.some(d => paperVenue.includes(d) || paperTitle.includes(d));
    if (domainMatch) score += 15;

    // 2. Keyword Density (25%)
    const keywords = queryIntel.keywords.map(k => k.toLowerCase());
    const matchedKeywords = keywords.filter(k => textToSearch.includes(k)).length;
    score += Math.min((matchedKeywords / Math.max(keywords.length, 1)) * 25, 25);

    // 3. Citation Velocity & Impact (15%)
    // Uses velocity (per-year citations) — rewards fast-growing papers over static giants
    const citations = paper.citations || 0;
    const age = Math.max(1, currentYear - (paper.year || currentYear - 5));
    const velocity = citations / age;
    score += Math.min(Math.log10(velocity + 1) * 7, 15);

    // 4. Intent Matching (15%)
    if (queryIntel.intent === 'methodological') {
      if (textToSearch.includes('method') || textToSearch.includes('approach') || textToSearch.includes('framework')) {
        score += 15;
      }
    } else if (queryIntel.intent === 'review') {
      if (textToSearch.includes('review') || textToSearch.includes('survey') || textToSearch.includes('meta-analysis')) {
        score += 15;
      }
    } else {
      score += 10;
    }

    // 5. Tiered Recency / Freshness (20%) — INCREASED from 10% to reflect RFIR priority
    let freshness: number;
    if      (age === 0)  freshness = 20;
    else if (age === 1)  freshness = 17;
    else if (age <= 3)   freshness = 13;
    else if (age <= 5)   freshness = 8;
    else if (age <= 10)  freshness = 4;
    else {
      // Seminal exception: heavily-cited old papers get a floor
      freshness = citations >= 500 ? 3 : Math.max(0, 2 - (age - 10) * 0.1);
    }
    score += freshness;

    // 6. Open Access bonus (5%)
    if (paper.isOpenAccess) score += 5;
    if (paper.pdfUrl)       score += 3; // bonus for direct access

    return Math.min(Math.round(score), 100);
  },

  /**
   * Identifies trending research based on citation velocity and publication dates
   */
  identifyTrends(papers: UniversalPaperEnriched[]): UniversalPaperEnriched[] {
    const currentYear = new Date().getFullYear();
    return papers
      .map(p => {
        const age = Math.max(1, currentYear - (p.year || currentYear));
        const velocity = (p.citations || 0) / age;
        return { ...p, trendScore: velocity };
      })
      .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
  },

  /**
   * Detects detailed methodology tools and approaches
   */
  detectDetailedMethodology(text: string): string[] {
    const methods: string[] = [];
    const t = text.toLowerCase();
    if (/sem-pls|smartpls|structural equation/i.test(t)) methods.push('SEM-PLS');
    if (/content analysis|analisis isi/i.test(t)) methods.push('Content Analysis');
    if (/r&d|research and development|pengembangan/i.test(t)) methods.push('R&D');
    if (/case study|studi kasus/i.test(t)) methods.push('Case Study');
    if (/phenomenology|fenomenologi/i.test(t)) methods.push('Phenomenology');
    if (/grounded theory/i.test(t)) methods.push('Grounded Theory');
    if (/literature review|tinjauan pustaka/i.test(t)) methods.push('Literature Review');
    return methods;
  },

  /**
   * Calculates Novelty Score (0-100) based on title/abstract uniqueness and recency
   */
  calculateNovelty(paper: UniversalPaperEnriched, allPapers: UniversalPaperEnriched[]): number {
    const title = (paper.title || '').toLowerCase();
    
    // Low score if many papers share the same key terms
    let overlapCount = 0;
    const keyTerms = title.split(' ').filter(w => w.length > 5);
    
    allPapers.forEach(p => {
      if (p.id === paper.id) return;
      const otherTitle = (p.title || '').toLowerCase();
      if (keyTerms.some(k => otherTitle.includes(k))) overlapCount++;
    });

    const currentYear = new Date().getFullYear();
    const age = currentYear - (paper.year || currentYear);
    
    let score = 70; // Base novelty
    if (age <= 1) score += 20;
    if (overlapCount < 2) score += 10;
    if (overlapCount > 5) score -= 20;

    return Math.min(Math.round(score), 100);
  },

  /**
   * Detects contradictory or supporting findings between a set of papers
   */
  async detectConflicts(papers: UniversalPaperEnriched[]): Promise<ResearchConflict[]> {
    if (papers.length < 2) return [];

    try {
      // Pick top 4 relevant papers to avoid token bloat
      const topPapers = papers.slice(0, 4);
      const papersMeta = topPapers.map((p, i) => 
        `[P${i+1}] Title: ${p.title}\nAbstract: ${(p.abstract || '').slice(0, 500)}`
      ).join('\n\n');

      const prompt = `Compare these research papers findings:
      ${papersMeta}
      
      Identify if there are any CONTRADICTORY or SUPPORTING findings between them.
      Return a JSON array of objects:
      [{ "paperA": "Title A", "paperB": "Title B", "topic": "Focus topic", "type": "contradictory" | "supporting" | "divergent", "description": "Brief explanation in Indonesian" }]
      
      Strict JSON only.`;

      const response = await geminiService.generateAI({
        paperId: 'conflict-analysis',
        type: 'intelligence',
        prompt,
        title: 'Batch Conflict Detection'
      });

      if (response && response.data) {
        let jsonStr = response.data.trim();
        const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.warn("[INTELLIGENCE] Conflict detection failed:", (e as Error).message);
    }
    return [];
  }
};
