import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiKeyManager } from "./AIKeyManager";

// embedding-001 is the stable Google AI embedding model
const EMBEDDING_MODEL = "embedding-001";

export const embeddingService = {
  async getEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) return [];

    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) {
      console.warn("[EMBEDDING] No API key available — skipping.");
      return [];
    }

    const cleanText = text.trim().slice(0, 8000);

    try {
      console.log(`[EMBEDDING] Generating embedding (${cleanText.length} chars) using ${EMBEDDING_MODEL}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

      const result = await Promise.race([
        model.embedContent(cleanText),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("EMBEDDING_TIMEOUT")), 10000)
        ),
      ]) as any;

      const values = result?.embedding?.values;
      if (!values || !Array.isArray(values) || values.length === 0) {
        throw new Error("EMPTY_EMBEDDING_RESPONSE");
      }

      // Only mark success for rate-limit tracking purposes
      aiKeyManager.markSuccess(apiKey);
      console.log(`[EMBEDDING] Success — ${values.length} dimensions`);
      return values;

    } catch (error: any) {
      const errorMsg = (error.message || "").toLowerCase();
      const isRateLimit =
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("too many requests");
      const isModelError =
        errorMsg.includes("not found") ||
        errorMsg.includes("404") ||
        errorMsg.includes("unsupported") ||
        errorMsg.includes("invalid");

      if (isRateLimit) {
        // Only penalize key for rate limits
        aiKeyManager.markFailure(apiKey, true);
        console.warn(`[EMBEDDING] Rate limited on key — cooldown applied.`);
      } else if (isModelError) {
        // Model config error — do NOT penalize the key
        console.error(`[EMBEDDING] [MODEL ERROR] Model '${EMBEDDING_MODEL}' issue: ${error.message}. Key is still healthy.`);
      } else {
        // Network or other transient error — light penalty
        aiKeyManager.markFailure(apiKey, false);
        console.warn(`[EMBEDDING] Transient error: ${error.message}`);
      }

      // Always fall back gracefully — never crash
      return [];
    }
  },

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
  },

  /** Keyword-based relevance fallback when embeddings are unavailable */
  keywordRelevance(query: string, text: string): number {
    if (!query || !text) return 0;
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (terms.length === 0) return 0;
    const target = text.toLowerCase();
    const matches = terms.filter((t) => target.includes(t)).length;
    return matches / terms.length;
  },
};
