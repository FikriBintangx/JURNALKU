import axios from 'axios';

export interface RerankResult {
  index: number;
  relevance_score: number;
}

export const cohereService = {
  /**
   * Reranks a list of documents against a query using Cohere's advanced reranking model.
   * Useful for significantly improving the semantic relevance of search results.
   */
  async rerankDocuments(query: string, documents: string[], topN = 10): Promise<RerankResult[]> {
    if (!process.env.COHERE_API_KEY) {
      console.warn("[Cohere] API key not found. Skipping intelligent reranking.");
      // Return original order with mock scores if API is not configured
      return documents.map((_, index) => ({ index, relevance_score: 1.0 - (index * 0.01) })).slice(0, topN);
    }

    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/rerank',
        {
          model: 'rerank-english-v3.0',
          query: query,
          documents: documents,
          top_n: topN,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.results;
    } catch (error: any) {
      console.error("[Cohere] Rerank error:", error?.response?.data || error.message);
      // Fallback
      return documents.map((_, index) => ({ index, relevance_score: 0 })).slice(0, topN);
    }
  }
};
