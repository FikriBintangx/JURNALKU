/**
 * ISAGI — Memory System
 * =====================
 * Multi-layer adaptive memory engine.
 * 
 * Layers:
 * 1. Short-Term Memory  — current session context
 * 2. Long-Term Memory   — learned concepts (Redis-backed)
 * 3. Episodic Memory    — historical interaction traces
 * 4. Semantic Memory    — concept relationship graph (in-memory KV)
 * 
 * Designed to work fully without a vector DB by using Redis + cosine similarity
 * on stored Google AI embeddings. Drop-in upgradeable to Qdrant/ChromaDB.
 */

import { redis } from '@/lib/redis';
import { embeddingService } from '../embeddingService';
import {
  ShortTermMemory, LongTermMemoryEntry, EpisodicMemoryEntry,
  SemanticMemoryEdge, KnowledgeNode, ConfidenceLevel
} from './types';

// ── Key Namespacing ────────────────────────────────────────────────────────

const KEY = {
  stm:     (sid: string) => `ISAGI:stm:${sid}`,
  ltm:     (concept: string) => `ISAGI:ltm:${concept.toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`,
  ltmIdx:  () => `ISAGI:ltm:index`,
  episodic:(sid: string) => `ISAGI:episodic:${sid}`,
  graph:   () => `ISAGI:kg:edges`,
  nodes:   () => `ISAGI:kg:nodes`,
};

const STM_TTL_S  = 3600;   // 1 hour
const LTM_TTL_S  = 604800; // 7 days
const EPI_TTL_S  = 86400;  // 24 hours
const MAX_STM_TURNS = 10;
const MIN_CONFIDENCE_TO_STORE = 0.6;
const SIMILARITY_THRESHOLD = 0.82;

// ── In-Process Short-Term Cache (no Redis needed for STM) ─────────────────
const inProcessSTM = new Map<string, ShortTermMemory>();

export const ISAGIMemory = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SHORT-TERM MEMORY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getSTM(sessionId: string): ShortTermMemory {
    if (inProcessSTM.has(sessionId)) {
      return inProcessSTM.get(sessionId)!;
    }
    const fresh: ShortTermMemory = {
      sessionId,
      turns: [],
      currentContext: '',
      activeTopics: [],
      lastUpdated: Date.now(),
    };
    inProcessSTM.set(sessionId, fresh);
    return fresh;
  },

  appendToSTM(sessionId: string, role: 'user' | 'assistant', content: string, paperIds?: string[]): void {
    const stm = this.getSTM(sessionId);
    stm.turns.push({
      role,
      content,
      timestamp: Date.now(),
      retrievedPaperIds: paperIds,
    });
    // Rolling window — keep only last N turns
    if (stm.turns.length > MAX_STM_TURNS) {
      stm.turns = stm.turns.slice(-MAX_STM_TURNS);
    }
    stm.currentContext = stm.turns
      .slice(-4)
      .map(t => `${t.role === 'user' ? 'User' : 'ISAGI'}: ${t.content.slice(0, 200)}`)
      .join('\n');
    stm.lastUpdated = Date.now();
    inProcessSTM.set(sessionId, stm);
  },

  getSTMContext(sessionId: string): string {
    const stm = this.getSTM(sessionId);
    return stm.currentContext;
  },

  clearSTM(sessionId: string): void {
    inProcessSTM.delete(sessionId);
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LONG-TERM MEMORY (Redis-backed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async storeLTM(entry: Omit<LongTermMemoryEntry, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>): Promise<boolean> {
    if (!redis) return false;
    try {
      const id = `ltm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const full: LongTermMemoryEntry = {
        ...entry,
        id,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 0,
      };
      const key = KEY.ltm(entry.concept);
      await redis.setex(key, LTM_TTL_S, JSON.stringify(full));

      // Index: store concept name in the LTM index set
      await redis.sadd(KEY.ltmIdx(), entry.concept.toLowerCase());
      console.log(`[ISAGI:MEM] LTM stored: "${entry.concept}" (confidence: ${entry.confidence})`);
      return true;
    } catch (e) {
      console.warn('[ISAGI:MEM] LTM store failed:', e);
      return false;
    }
  },

  async retrieveLTMByKey(concept: string): Promise<LongTermMemoryEntry | null> {
    if (!redis) return null;
    try {
      const raw = await redis.get<string>(KEY.ltm(concept));
      if (!raw) return null;
      const entry: LongTermMemoryEntry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Update access stats
      entry.accessCount++;
      entry.lastAccessedAt = Date.now();
      await redis.setex(KEY.ltm(concept), LTM_TTL_S, JSON.stringify(entry));
      return entry;
    } catch (e) {
      return null;
    }
  },

  async semanticRecall(queryEmbedding: number[], topK: number = 3): Promise<LongTermMemoryEntry[]> {
    if (!redis || queryEmbedding.length === 0) return [];

    try {
      // Get all indexed concepts
      const concepts = await redis.smembers(KEY.ltmIdx());
      if (!concepts || concepts.length === 0) return [];

      const candidates: Array<{ entry: LongTermMemoryEntry; similarity: number }> = [];

      // Batch retrieve (in production, swap this for Qdrant ANN)
      for (const concept of concepts.slice(0, 100)) { // cap at 100 for perf
        const entry = await this.retrieveLTMByKey(concept);
        if (entry && entry.embedding && entry.embedding.length > 0) {
          const sim = embeddingService.cosineSimilarity(queryEmbedding, entry.embedding);
          if (sim >= SIMILARITY_THRESHOLD) {
            candidates.push({ entry, similarity: sim });
          }
        }
      }

      candidates.sort((a, b) => b.similarity - a.similarity);
      const results = candidates.slice(0, topK).map(c => c.entry);
      console.log(`[ISAGI:MEM] Semantic recall: ${results.length} hits from ${concepts.length} concepts`);
      return results;
    } catch (e) {
      console.warn('[ISAGI:MEM] Semantic recall failed:', e);
      return [];
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EPISODIC MEMORY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async storeEpisode(entry: EpisodicMemoryEntry): Promise<void> {
    if (!redis) return;
    try {
      const key = KEY.episodic(entry.sessionId);
      const existing = await redis.get<string>(key);
      const episodes: EpisodicMemoryEntry[] = existing
        ? JSON.parse(typeof existing === 'string' ? existing : JSON.stringify(existing))
        : [];
      episodes.push(entry);
      const recent = episodes.slice(-20); // Keep last 20 episodes per session
      await redis.setex(key, EPI_TTL_S, JSON.stringify(recent));
    } catch (e) {
      console.warn('[ISAGI:MEM] Episodic store failed:', e);
    }
  },

  async getEpisodes(sessionId: string): Promise<EpisodicMemoryEntry[]> {
    if (!redis) return [];
    try {
      const raw = await redis.get<string>(KEY.episodic(sessionId));
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEMANTIC MEMORY / KNOWLEDGE GRAPH (Lightweight in-Redis)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async addSemanticEdge(edge: SemanticMemoryEdge): Promise<void> {
    if (!redis) return;
    try {
      const raw = await redis.get<string>(KEY.graph());
      const edges: SemanticMemoryEdge[] = raw
        ? JSON.parse(typeof raw === 'string' ? raw : '[]')
        : [];
      // Avoid duplicates — update weight if exists
      const existingIdx = edges.findIndex(e => e.from === edge.from && e.to === edge.to && e.relation === edge.relation);
      if (existingIdx >= 0) {
        edges[existingIdx].weight = Math.min(1, (edges[existingIdx].weight + edge.weight) / 1.5);
      } else {
        edges.push(edge);
      }
      await redis.setex(KEY.graph(), LTM_TTL_S, JSON.stringify(edges.slice(-500))); // cap at 500 edges
    } catch (e) {
      console.warn('[ISAGI:MEM] Semantic edge failed:', e);
    }
  },

  async getRelatedConcepts(concept: string): Promise<string[]> {
    if (!redis) return [];
    try {
      const raw = await redis.get<string>(KEY.graph());
      if (!raw) return [];
      const edges: SemanticMemoryEdge[] = JSON.parse(typeof raw === 'string' ? raw : '[]');
      const lower = concept.toLowerCase();
      return edges
        .filter(e => e.from === lower || e.to === lower)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .map(e => (e.from === lower ? e.to : e.from));
    } catch {
      return [];
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INTELLIGENT AUTO-STORAGE
  // Automatically extract and store important concepts from AI outputs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async autoStoreInsights(
    query: string,
    answer: string,
    domains: string[],
    paperIds: string[],
    confidence: ConfidenceLevel
  ): Promise<boolean> {
    if (confidence === 'low') return false;

    try {
      const embedding = await embeddingService.getEmbedding(`${query} ${answer.slice(0, 500)}`);

      // Extract key concepts (simple heuristic — in production use NER)
      const concept = query.slice(0, 80).toLowerCase();
      const relatedConcepts = domains.slice(0, 3);

      await this.storeLTM({
        concept,
        summary: answer.slice(0, 600),
        embedding,
        relatedConcepts,
        sourcePaperIds: paperIds.slice(0, 5),
        confidence,
        tags: domains,
      });

      // Build semantic edges between related concepts
      for (const rc of relatedConcepts) {
        await this.addSemanticEdge({
          from: concept,
          to: rc.toLowerCase(),
          relation: 'related_to',
          weight: 0.7,
        });
      }

      return true;
    } catch (e) {
      console.warn('[ISAGI:MEM] Auto-store failed:', e);
      return false;
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MEMORY STATISTICS (for debugging / monitoring)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async getStats(): Promise<{ ltmCount: number; stmSessions: number; graphEdges: number }> {
    const stmSessions = inProcessSTM.size;
    if (!redis) return { ltmCount: 0, stmSessions, graphEdges: 0 };
    try {
      const ltmCount = await redis.scard(KEY.ltmIdx()) || 0;
      const rawGraph = await redis.get<string>(KEY.graph());
      const graphEdges = rawGraph
        ? JSON.parse(typeof rawGraph === 'string' ? rawGraph : '[]').length
        : 0;
      return { ltmCount, stmSessions, graphEdges };
    } catch {
      return { ltmCount: 0, stmSessions, graphEdges: 0 };
    }
  },
};
