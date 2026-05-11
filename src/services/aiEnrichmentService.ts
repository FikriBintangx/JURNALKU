/**
 * AI Enrichment Service
 * 
 * Runs Gemini analysis on papers to generate:
 * - Relevance score (0-100)
 * - Research method detection
 * - Topic category classification
 * - Complexity level
 * - Short AI summary
 * - AI keywords
 *
 * DESIGN RULES:
 * - Enrichment runs ONCE per paper (cached in Redis)
 * - Never blocks search results
 * - Always returns graceful fallback if AI fails
 * - Does NOT penalize keys for model errors
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager, classifyAIError } from "./AIKeyManager";
import type { AIEnrichment, ResearchMethod, TopicCategory, ComplexityLevel } from "@/types/filters";

const MODEL = "gemini-2.0-flash";
const FALLBACK_MODEL = "gemini-1.5-flash-latest";
const CACHE_TTL = 60 * 60 * 24; // 24 hours

function buildEnrichmentPrompt(title: string, abstract: string, query: string): string {
  return `Analyze this academic paper and return a JSON object ONLY (no markdown, no explanation).

Paper Title: ${title.slice(0, 200)}
Abstract: ${abstract.slice(0, 1500)}
User Search Query: ${query.slice(0, 150)}

Return this EXACT JSON structure:
{
  "relevanceScore": <integer 0-100, how relevant is this paper to the user's query>,
  "researchMethod": <one of: "kuantitatif" | "kualitatif" | "mixed_method" | "literature_review" | "eksperimen" | "unknown">,
  "category": <one of: "teknologi" | "bisnis" | "pendidikan" | "kesehatan" | "sosial" | "ekonomi" | "marketing" | "sains" | "hukum" | "lainnya">,
  "complexity": <one of: "beginner" | "intermediate" | "expert">,
  "shortSummary": "<2 sentences in Indonesian summarizing the key finding>",
  "aiKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- relevanceScore: 90-100 if directly matches query, 70-89 if closely related, 50-69 if somewhat related, <50 if not related
- researchMethod: detect from methodology mentions (survey=kuantitatif, interview=kualitatif, etc.)
- complexity: beginner=accessible to undergrads, expert=requires domain expertise
- ONLY return valid JSON, nothing else`;
}

function createFallbackEnrichment(query: string, title: string): AIEnrichment {
  // Simple keyword-based relevance estimation
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const titleLower = title.toLowerCase();
  const matchCount = queryTerms.filter(t => titleLower.includes(t)).length;
  const relevanceScore = queryTerms.length > 0
    ? Math.min(Math.round((matchCount / queryTerms.length) * 80) + 10, 85)
    : 50;

  return {
    relevanceScore,
    researchMethod: 'unknown',
    category: 'lainnya',
    complexity: 'intermediate',
    shortSummary: title.slice(0, 150),
    aiKeywords: title.split(/\s+/).filter(w => w.length > 4).slice(0, 5),
    enrichedAt: Date.now(),
  };
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  });

  const result = await Promise.race([
    geminiModel.generateContent(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error("ENRICH_TIMEOUT")), 12000)),
  ]) as any;

  return result?.response?.text?.() || '';
}

function parseEnrichmentJSON(raw: string): AIEnrichment | null {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    // Find JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    // Validate and sanitize
    return {
      relevanceScore: Math.min(100, Math.max(0, parseInt(parsed.relevanceScore) || 50)),
      researchMethod: (parsed.researchMethod as ResearchMethod) || 'unknown',
      category: (parsed.category as TopicCategory) || 'lainnya',
      complexity: (parsed.complexity as ComplexityLevel) || 'intermediate',
      shortSummary: (parsed.shortSummary || '').slice(0, 500),
      aiKeywords: Array.isArray(parsed.aiKeywords)
        ? parsed.aiKeywords.slice(0, 8).map(String)
        : [],
      enrichedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export const aiEnrichmentService = {
  /**
   * Enriches a single paper with AI analysis.
   * Uses Redis cache to avoid re-running Gemini on the same paper.
   * Never throws — always returns enrichment data (AI or fallback).
   */
  async enrichPaper(
    paperId: string,
    title: string,
    abstract: string,
    query: string = ''
  ): Promise<AIEnrichment> {
    const cacheKey = `enrich:v2:${paperId}:${query.slice(0, 30).replace(/\s+/g, '_')}`;

    // 1. Cache check
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached && typeof cached === 'object') {
          console.log(`[ENRICHMENT] Cache hit: ${paperId}`);
          return cached as AIEnrichment;
        }
      } catch {
        // Non-critical cache read failure
      }
    }

    // 2. Skip AI if no content
    if (!title && !abstract) {
      return createFallbackEnrichment(query, title || 'Unknown');
    }

    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) {
      console.warn("[ENRICHMENT] No API key — using fallback.");
      return createFallbackEnrichment(query, title);
    }

    const prompt = buildEnrichmentPrompt(title, abstract, query);

    // 3. Try primary model
    try {
      const raw = await callGemini(apiKey, MODEL, prompt);
      const enrichment = parseEnrichmentJSON(raw);

      if (enrichment) {
        aiKeyManager.markSuccess(apiKey);
        console.log(`[ENRICHMENT] Success: ${paperId} score=${enrichment.relevanceScore}`);

        // Cache the result
        if (redis) {
          try { await redis.set(cacheKey, enrichment, { ex: CACHE_TTL }); } catch {}
        }
        return enrichment;
      }
      throw new Error("PARSE_FAILED");

    } catch (primaryErr: any) {
      const errType = classifyAIError(primaryErr);

      if (errType === 'RATE_LIMIT') aiKeyManager.markFailure(apiKey, true);
      else if (errType === 'NETWORK_ERROR') aiKeyManager.markFailure(apiKey, false);
      // MODEL_ERROR: no key penalty

      // Try fallback model for model errors
      if (errType === 'MODEL_ERROR') {
        try {
          const raw2 = await callGemini(apiKey, FALLBACK_MODEL, prompt);
          const enrichment2 = parseEnrichmentJSON(raw2);
          if (enrichment2) {
            aiKeyManager.markSuccess(apiKey);
            if (redis) {
              try { await redis.set(cacheKey, enrichment2, { ex: CACHE_TTL }); } catch {}
            }
            return enrichment2;
          }
        } catch {
          // Fallback model also failed
        }
      }

      // Return keyword-based fallback — always succeeds
      console.warn(`[ENRICHMENT] [FALLBACK] Using keyword fallback for ${paperId}`);
      const fallback = createFallbackEnrichment(query, title);

      // Cache fallback too (shorter TTL)
      if (redis) {
        try { await redis.set(cacheKey, fallback, { ex: 60 * 30 }); } catch {}
      }
      return fallback;
    }
  },

  /**
   * Batch enriches multiple papers — runs in parallel with concurrency limit.
   * Returns enrichment map: paperId → AIEnrichment.
   * Non-blocking: errors on individual papers don't fail the batch.
   */
  async enrichBatch(
    papers: Array<{ id: string; paperId?: string; title: string; abstract: string }>,
    query: string = '',
    maxConcurrent: number = 3
  ): Promise<Map<string, AIEnrichment>> {
    const results = new Map<string, AIEnrichment>();
    if (!papers || papers.length === 0) return results;

    // Process in chunks to avoid API flooding
    for (let i = 0; i < papers.length; i += maxConcurrent) {
      const chunk = papers.slice(i, i + maxConcurrent);
      const chunkResults = await Promise.allSettled(
        chunk.map(p => this.enrichPaper(p.paperId || p.id, p.title, p.abstract, query))
      );

      chunk.forEach((paper, idx) => {
        const result = chunkResults[idx];
        const key = paper.paperId || paper.id;
        if (result.status === 'fulfilled') {
          results.set(key, result.value);
        } else {
          results.set(key, createFallbackEnrichment(query, paper.title));
        }
      });

      // Small delay between chunks to be API-friendly
      if (i + maxConcurrent < papers.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`[ENRICHMENT] Batch complete: ${results.size}/${papers.length} papers enriched`);
    return results;
  },
};
