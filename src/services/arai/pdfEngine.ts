import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { UniversalPaperEnriched } from './types';

export interface PDFChunk {
  page: number;
  content: string;
  section?: string;
  embedding?: number[];
}

export interface PDFData {
  paperId: string;
  fullText: string;
  chunks: PDFChunk[];
  metadata: {
    pageCount: number;
    wordCount: number;
    sections: string[];
  };
}

/**
 * ISAGI PDF RAG ENGINE
 * Core system for deep document extraction and page-aware chunking
 */
export const pdfEngine = {
  
  /**
   * Fetches and parses a PDF from a URL
   */
  async processPDF(url: string, paperId: string): Promise<PDFData | null> {
    try {
      console.log(`[PDF_ENGINE] Processing: ${url}`);
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      const buffer = Buffer.from(response.data);
      
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      
      const fullText = data.text;
      const chunks: PDFChunk[] = this.chunkText(fullText);
      const sections = this.detectSections(fullText);

      const result = {
        paperId,
        fullText,
        chunks,
        metadata: {
          pageCount: data.total,
          wordCount: fullText.split(/\s+/).length,
          sections
        }
      };
      await parser.destroy();
      return result;
    } catch (err: any) {
      console.error(`[PDF_ENGINE] Error processing ${url}: ${err.message}`);
      return null;
    }
  },

  /**
   * Chunks text into manageable pieces for vector search
   */
  chunkText(text: string, chunkSize: number = 1000): PDFChunk[] {
    const chunks: PDFChunk[] = [];
    const words = text.split(/\s+/);
    let currentChunk: string[] = [];
    let pageCount = 1;

    for (let i = 0; i < words.length; i++) {
      currentChunk.push(words[i]);
      if (currentChunk.length >= chunkSize) {
        chunks.push({
          page: pageCount,
          content: currentChunk.join(' '),
          section: 'General Content'
        });
        currentChunk = [];
        // Estimation: every 500 words is roughly 1 page in academic formatting
        if (i % 500 === 0) pageCount++;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({ page: pageCount, content: currentChunk.join(' ') });
    }

    return chunks;
  },

  /**
   * Simple heuristic for section detection
   */
  detectSections(text: string): string[] {
    const commonSections = [
      'ABSTRACT', 'INTRODUCTION', 'METHODOLOGY', 'METHODS', 
      'RESULTS', 'DISCUSSION', 'CONCLUSION', 'REFERENCES'
    ];
    
    return commonSections.filter(section => {
      const regex = new RegExp(`^\\d*\\s*${section}`, 'im');
      return regex.test(text);
    });
  }
};
