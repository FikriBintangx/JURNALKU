import * as pdfParse from 'pdf-parse';

export interface DocumentChunkParams {
  text: string;
  page?: number;
  section?: string;
}

/**
 * Advanced Academic PDF Processor for ISAGI Workspace
 * Performs Smart Chunking based on semantic boundaries and typical academic structure.
 */
export const pdfProcessor = {
  /**
   * Parse a raw PDF buffer into full text and pages
   */
  async parseBuffer(buffer: Buffer): Promise<{ fullText: string; pageCount: number; info: any }> {
    const data = await (pdfParse as any)(buffer);
    return {
      fullText: data.text,
      pageCount: data.numpages,
      info: data.info
    };
  },

  /**
   * Smart Chunking Engine
   * Chunks document based on academic sections rather than arbitrary character counts.
   */
  chunkText(text: string): DocumentChunkParams[] {
    const chunks: DocumentChunkParams[] = [];
    
    // Regular expression to detect academic headers
    // e.g., "1. Introduction", "II. Methodology", "Abstract", "Conclusion"
    const sectionRegex = /^(?:[0-9IVX]+\.?\s*)?(Abstract|Introduction|Background|Related Work|Literature Review|Methodology|Methods|Materials and Methods|Results|Findings|Discussion|Conclusion|Conclusions|References|Bibliography)(?:\s*:)?\s*$/im;
    
    // Split text into paragraphs first (separated by double newlines)
    const paragraphs = text.split(/\n\s*\n/);
    
    let currentSection = 'General';
    let currentChunk = '';
    const CHUNK_MAX_SIZE = 1200; // Optimal for embeddings (approx 300-400 tokens)

    for (const para of paragraphs) {
      const cleanPara = para.replace(/\s+/g, ' ').trim();
      if (cleanPara.length < 10) continue; // Skip noise

      // Detect if this paragraph is actually a section header
      const headerMatch = cleanPara.match(sectionRegex);
      if (headerMatch && cleanPara.length < 100) {
        // If we have an existing chunk, push it before starting new section
        if (currentChunk.trim().length > 0) {
          chunks.push({ text: currentChunk.trim(), section: currentSection });
        }
        currentSection = headerMatch[1]; // e.g., "Introduction"
        currentChunk = '';
        continue;
      }

      // If adding this paragraph exceeds our optimal semantic size, push current chunk
      if (currentChunk.length + cleanPara.length > CHUNK_MAX_SIZE) {
        if (currentChunk.trim().length > 0) {
          chunks.push({ text: currentChunk.trim(), section: currentSection });
        }
        currentChunk = cleanPara;
      } else {
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + cleanPara;
      }
    }

    // Push the final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({ text: currentChunk.trim(), section: currentSection });
    }

    return chunks;
  }
};
