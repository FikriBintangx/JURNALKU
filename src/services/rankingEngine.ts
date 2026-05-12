import { UniversalPaper } from './searchAggregator';
import { embeddingService } from './embeddingService';

export const rankingEngine = {
  /**
   * Calculates relevance scores for papers based on semantic similarity, 
   * citations, recency, and keyword matches.
   * Rule: Anti-Error, Anti-Undefined
   */
  calculateScores(papers: UniversalPaper[] | undefined | null, queryEmbedding: number[], query: string): UniversalPaper[] {
    if (!papers || papers.length === 0) return [];
    
    const safeQuery = (query || "").toLowerCase().trim();
    const currentYear = new Date().getFullYear();
    
    // Find max citations safely
    let maxCitations = 1;
    try {
      const citationCounts = papers.map(p => p.citations || 0);
      if (citationCounts.length > 0) maxCitations = Math.max(...citationCounts, 1);
    } catch { maxCitations = 1; }

    const queryTerms = safeQuery.split(/\s+/).filter(t => t.length > 1);

    return papers.map((paper) => {
      if (!paper) return null;

      const paperYear = paper.year || (currentYear - 10);
      const age       = Math.max(0, currentYear - paperYear);
      const citations = paper.citations || 0;

      // 1. Semantic Similarity (35%) — unchanged, uses embeddings
      let similarity = 0.5;
      try {
        if (paper.embedding && queryEmbedding && queryEmbedding.length > 0) {
          similarity = embeddingService.cosineSimilarity(queryEmbedding, paper.embedding);
        }
      } catch { similarity = 0.5; }

      // 2. Citation Count (15%) — log-scaled, not dominant
      const citationScore = Math.min(Math.log10(citations + 1) / Math.log10(maxCitations + 1), 1);

      // 3. Tiered Recency (30%) — PRIMARY freshness lever
      let recencyScore: number;
      if      (age === 0)  recencyScore = 1.0;   // Current year
      else if (age === 1)  recencyScore = 0.87;  // Last year
      else if (age <= 3)   recencyScore = 0.67;  // 2–3 years
      else if (age <= 5)   recencyScore = 0.43;  // 4–5 years
      else if (age <= 10)  recencyScore = 0.23;  // 6–10 years
      else                 recencyScore = Math.max(0, 0.13 - (age - 10) * 0.01);

      // Seminal exception — keep important old works visible
      const isSeminal = citations >= 500 && age > 10;
      if (isSeminal) recencyScore = Math.max(recencyScore, 0.33);

      // 4. Citation Velocity (0–1 normalized) — replaces flat recency decay
      const velocity = citations / Math.max(1, age);
      const velocityNorm = Math.min(Math.log10(velocity + 1) / 3, 1);

      // 5. Keyword Match (12%)
      let keywordScore = 0;
      if (queryTerms.length > 0) {
        const titleLower = (paper.title || "").toLowerCase();
        const matchCount = queryTerms.filter(term => titleLower.includes(term)).length;
        keywordScore = Math.min(matchCount / queryTerms.length, 1);
      }

      // 6. Quality & Completeness (8%)
      const hasAbstract = !!paper.abstract ? 0.5 : 0;
      const hasPdf      = !!paper.pdfUrl   ? 0.5 : 0;
      const qualityScore = hasAbstract + hasPdf;

      // Composite — Recency 30%, Semantic 35%, Velocity 10%, Citations 15%, Keyword 12%, Quality 8%
      const finalScore =
        (similarity    * 35) +
        (citationScore * 15) +
        (recencyScore  * 30) +
        (velocityNorm  * 10) +
        (keywordScore  * 12) +
        (qualityScore  *  8);

      const isNew     = age <= 1;
      const isRising  = velocity >= 15 && age <= 5;

      return {
        ...paper,
        relevanceScore: Math.round(Math.min(finalScore, 100)),
        trendScore: velocity,
        isNew,
        isRising,
      };
    })
    .filter(Boolean)
    .sort((a, b) => ((b as UniversalPaper).relevanceScore || 0) - ((a as UniversalPaper).relevanceScore || 0)) as UniversalPaper[];
  }
};

