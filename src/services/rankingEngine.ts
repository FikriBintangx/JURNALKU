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
      if (citationCounts.length > 0) {
        maxCitations = Math.max(...citationCounts, 1);
      }
    } catch (e) {
      maxCitations = 1;
    }

    const queryTerms = safeQuery.split(/\s+/).filter(t => t.length > 1);

    return papers.map((paper) => {
      if (!paper) return null;

      // 1. Semantic Similarity (40%)
      let similarity = 0.5; // Default neutral similarity
      try {
        if (paper.embedding && queryEmbedding && queryEmbedding.length > 0) {
          similarity = embeddingService.cosineSimilarity(queryEmbedding, paper.embedding);
        }
      } catch (e) {
        similarity = 0.5;
      }

      // 2. Citation Count (20%) - Logarithmic scaling
      const citations = paper.citations || 0;
      const citationScore = Math.min(Math.log10(citations + 1) / Math.log10(maxCitations + 1), 1);

      // 3. Recency (15%) - Exponential decay for older papers
      const year = paper.year || (currentYear - 20);
      const age = Math.max(0, currentYear - year);
      const recencyScore = Math.max(0, 1 - (age / 30)); // 30 years window

      // 4. Keyword Match (15%)
      let keywordScore = 0;
      if (queryTerms.length > 0) {
        const titleLower = (paper.title || "").toLowerCase();
        const matchCount = queryTerms.filter(term => titleLower.includes(term)).length;
        keywordScore = Math.min(matchCount / queryTerms.length, 1);
      }

      // 5. Source Quality & Completeness (10%)
      const hasAbstract = !!paper.abstract ? 0.5 : 0;
      const hasPdf = !!paper.pdfUrl ? 0.5 : 0;
      const qualityScore = hasAbstract + hasPdf;

      const finalScore = (similarity * 40) + 
                         (citationScore * 20) + 
                         (recencyScore * 15) + 
                         (keywordScore * 15) + 
                         (qualityScore * 10);

      return {
        ...paper,
        relevanceScore: Math.round(finalScore)
      };
    })
    .filter((p): p is UniversalPaper => p !== null)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }
};

