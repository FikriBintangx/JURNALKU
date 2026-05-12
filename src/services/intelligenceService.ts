import { geminiService } from "./geminiService";
import { UniversalPaperEnriched } from "@/types/search";

export interface ResearchIntelligence {
  intent: 'exploratory' | 'methodological' | 'review' | 'comparative' | 'generic';
  domains: string[];
  keywords: string[];
  questions: string[];
  summary?: string;
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
      const prompt = `Analyze this academic research query: "${query}"
      
      Return a JSON object with:
      - intent: (exploratory/methodological/review/comparative/generic)
      - domains: (up to 3 academic fields)
      - keywords: (5-8 related academic keywords in English and Indonesian)
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
  }
};
