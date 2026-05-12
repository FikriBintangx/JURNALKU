import prisma from '@/lib/prisma';
import { embeddingService } from '../embeddingService';
import { pdfProcessor } from './pdfProcessor';

export interface VectorRecallResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  section: string | null;
  content: string;
  similarity: number;
}

/**
 * Personal Vector Memory Engine
 * Handles embedding generation, semantic storage, and cosine-similarity recall.
 */
export const vectorMemory = {
  
  /**
   * Ingests a new document into the personal vector memory.
   * Runs the PDF through Smart Chunking, embeds each chunk, and saves to DB.
   */
  async ingestDocument(
    userId: string, 
    fileName: string, 
    buffer: Buffer, 
    type: 'pdf' | 'docx' = 'pdf'
  ): Promise<string> {
    console.log(`[VECTOR_MEMORY] Ingesting document: ${fileName} for user: ${userId}`);
    
    // 1. Parse & Chunk
    const { fullText, info } = await pdfProcessor.parseBuffer(buffer);
    const chunks = pdfProcessor.chunkText(fullText);
    
    // 2. Create parent document
    const title = info?.Title || fileName.replace(/\.[^/.]+$/, "");
    const document = await prisma.workspaceDocument.create({
      data: {
        userId,
        title,
        fileName,
        type,
        content: fullText.slice(0, 50000), // Store up to 50k chars of raw text for fallback
        metadata: info
      }
    });

    console.log(`[VECTOR_MEMORY] Created document ${document.id}. Processing ${chunks.length} semantic chunks...`);

    // 3. Process chunks sequentially to respect API rate limits
    for (const [index, chunk] of chunks.entries()) {
      try {
        const embedding = await embeddingService.getEmbedding(chunk.text);
        if (embedding.length > 0) {
          await prisma.documentChunk.create({
            data: {
              documentId: document.id,
              content: chunk.text,
              section: chunk.section || 'General',
              embedding: embedding // Prisma automatically maps Float[]
            }
          });
        }
      } catch (err) {
        console.warn(`[VECTOR_MEMORY] Failed to embed chunk ${index} of ${fileName}:`, err);
      }
    }

    console.log(`[VECTOR_MEMORY] Ingestion complete for ${fileName}.`);
    return document.id;
  },

  /**
   * Semantic Recall (RAG Retrieval)
   * Finds the most relevant chunks across a user's entire personal library.
   */
  async recall(userId: string, query: string, topK: number = 5): Promise<VectorRecallResult[]> {
    console.log(`[VECTOR_MEMORY] Recalling memory for query: "${query}"`);
    
    // 1. Embed the search query
    const queryEmbedding = await embeddingService.getEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    // 2. Fetch all chunks belonging to the user's documents
    // Note: For massive scale, this should use pgvector raw SQL: 
    // SELECT * FROM "DocumentChunk" ORDER BY embedding <-> '[...]' LIMIT 5
    // But for a personal workspace (100-1000 chunks), in-memory JS cosine similarity is lightning fast.
    const userDocs = await prisma.workspaceDocument.findMany({
      where: { userId },
      include: { chunks: true }
    });

    const allChunks = userDocs.flatMap(doc => 
      doc.chunks.map(chunk => ({
        chunk,
        documentTitle: doc.title
      }))
    );

    // 3. Calculate similarities and sort
    const scoredChunks = allChunks.map(item => ({
      chunkId: item.chunk.id,
      documentId: item.chunk.documentId,
      documentTitle: item.documentTitle,
      section: item.chunk.section,
      content: item.chunk.content,
      similarity: embeddingService.cosineSimilarity(queryEmbedding, item.chunk.embedding)
    }));

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    // Filter minimum relevance threshold (0.6 is a good baseline for Google text-embedding-004)
    return scoredChunks
      .filter(chunk => chunk.similarity > 0.6)
      .slice(0, topK);
  }
};
