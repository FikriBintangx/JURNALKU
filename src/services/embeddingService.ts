import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiKeyManager } from "./AIKeyManager";
import { providerHealth } from "./arai/providerHealth";

// Modern high-performance Google AI embedding model
const DEFAULT_GEMINI_EMBEDDING_MODEL = "text-embedding-004";

export interface EmbeddingProvider {
  getEmbedding(text: string): Promise<number[]>;
  name: string;
}

class EmbeddingService {
  // Simple in-memory cache for embeddings to avoid duplicate generation
  private cache: Map<string, number[]> = new Map();

  async getEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return [];
    
    const hash = this.simpleHash(text);
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    // Try Gemini First (with health tracking)
    const geminiResult = await this.tryGeminiEmbedding(text);
    if (geminiResult.length > 0) {
      this.cache.set(hash, geminiResult);
      return geminiResult;
    }

    // RESILIENT FALLBACK: Pseudo-embedding based on hash projection
    // This allows the system to continue functioning (similarity still works) even without API access
    const fallback = this.generatePseudoEmbedding(text);
    this.cache.set(hash, fallback);
    return fallback;
  }

  private async tryGeminiEmbedding(text: string): Promise<number[]> {
    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) return [];

    // Check health before calling
    if (!providerHealth.isHealthy("embedding")) return [];

    const cleanText = text.trim().slice(0, 8000);
    const t0 = Date.now();

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_EMBEDDING_MODEL });

      const result = await Promise.race([
        model.embedContent(cleanText),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("EMBEDDING_TIMEOUT")), 10000)
        ),
      ]) as any;

      const values = result?.embedding?.values;
      if (values && Array.isArray(values) && values.length > 0) {
        aiKeyManager.markSuccess(apiKey);
        providerHealth.reportSuccess("embedding", Date.now() - t0);
        return values;
      }
      return [];
    } catch (error: any) {
      const type = (error.message || "").toLowerCase();
      const isQuota = type.includes("429") || type.includes("quota");
      
      aiKeyManager.markFailure(apiKey, isQuota);
      providerHealth.reportFailure("embedding", error.message);
      
      return [];
    }
  }

  /** 
   * Generates a deterministic high-dimensional vector for a string.
   * Useful for maintaining "relative similarity" during API outages.
   */
  private generatePseudoEmbedding(text: string, dims: number = 768): number[] {
    const vector = new Array(dims).fill(0);
    const words = text.toLowerCase().split(/\s+/).slice(0, 50);
    
    words.forEach((word, wordIdx) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0;
      }
      // Project hash onto multiple indices in the vector
      for (let j = 0; j < 5; j++) {
        const idx = Math.abs((hash ^ (j * 7919))) % dims;
        vector[idx] += (1 / (wordIdx + 1));
      }
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v*v, 0));
    return magnitude === 0 ? vector : vector.map(v => v / magnitude);
  }

  private simpleHash(s: string): string {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /** Keyword-based relevance fallback when embeddings are unavailable */
  keywordRelevance(query: string, text: string): number {
    if (!query || !text) return 0;
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (terms.length === 0) return 0;
    const target = text.toLowerCase();
    const matches = terms.filter((t) => target.includes(t)).length;
    return matches / terms.length;
  }
}

export const embeddingService = new EmbeddingService();
