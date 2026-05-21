import { embeddingService } from '../../services/embeddingService';
import { redis } from '../../lib/redis';

export interface Memory {
  id: string;
  concept: string;
  summary: string;
  embedding: number[];
  importance: number;
  timestamp: number;
}

export class MemoryEngine {
  async store(concept: string, summary: string, importance: number = 1) {
    const embedding = await embeddingService.getEmbedding(`${concept}: ${summary}`);
    const memory: Memory = {
      id: Math.random().toString(36).substring(2),
      concept,
      summary,
      embedding,
      importance,
      timestamp: Date.now()
    };

    if (redis) {
      await redis.lpush('isagi:memories', JSON.stringify(memory));
      await redis.ltrim('isagi:memories', 0, 100); // Keep last 100
    }
  }

  async recall(query: string, limit: number = 5): Promise<Memory[]> {
    // FIX: Generate real embedding from query string
    const queryEmbedding = await embeddingService.getEmbedding(query);
    
    if (!redis) return [];
    
    const rawMemories = await redis.lrange('isagi:memories', 0, -1);
    const memories: Memory[] = rawMemories.map(m => JSON.parse(m));

    return memories
      .map(m => ({
        ...m,
        score: this.calculateScore(queryEmbedding, m)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateScore(queryVector: number[], memory: Memory): number {
    const semantic = embeddingService.cosineSimilarity(queryVector, memory.embedding);
    
    // Time decay (recency)
    const hoursSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60);
    const recency = Math.exp(-0.1 * hoursSince);
    
    // Weighted combination
    return (semantic * 0.7) + (recency * 0.2) + (memory.importance * 0.1);
  }
}

export const memoryEngine = new MemoryEngine();
