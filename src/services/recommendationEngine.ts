import prisma from '@/lib/prisma';
import { embeddingService } from './embeddingService';
import { UniversalPaper } from './searchAggregator';

export const recommendationEngine = {
  async getSimilarPapers(paperId: string, limit: number = 5): Promise<any[]> {
    const targetPaper = await prisma.journal.findUnique({
      where: { id: paperId }
    });

    if (!targetPaper || !targetPaper.embedding) return [];

    // In a real pgvector setup, we would use a raw SQL query for vector similarity.
    // Since we are using Prisma Float[], we can do a manual calculation or raw query.
    // For performance, raw query is preferred.
    
    const results = await prisma.$queryRaw`
      SELECT id, title, abstract, citations, year, authors, source,
             (embedding <=> ${targetPaper.embedding}::vector) as distance
      FROM "Journal"
      WHERE id != ${paperId}
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    return results as any[];
  },

  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // 1. Get user's recent interactions
    const interactions = await prisma.userInteraction.findMany({
      where: { userId },
      include: { journal: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (!interactions.length) return [];

    // 2. Average the embeddings of their interacted papers
    const embeddings = interactions
      .map(i => i.journal.embedding)
      .filter((e): e is number[] => !!e && e.length > 0);

    if (!embeddings.length) return [];

    const avgEmbedding = embeddings[0].map((_, i) => 
      embeddings.reduce((acc, curr) => acc + curr[i], 0) / embeddings.length
    );

    // 3. Find papers similar to their average interest
    const recommendations = await prisma.$queryRaw`
      SELECT id, title, abstract, citations, year, authors, source,
             (embedding <=> ${avgEmbedding}::vector) as distance
      FROM "Journal"
      ORDER BY distance ASC
      LIMIT ${limit}
    `;

    return recommendations as any[];
  }
};
