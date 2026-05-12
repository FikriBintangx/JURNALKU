import { PDFParse } from 'pdf-parse';
import { embeddingService } from '../embeddingService';
import { ISAGIMemory } from './memorySystem';
import { ConfidenceLevel } from './types';
import { smartOrchestrator } from './smartOrchestrator';

export interface ProcessedDocument {
  title: string;
  author?: string;
  doi?: string;
  content: string;
  chunks: string[];
  metadata: Record<string, any>;
  variables: string[];
  methodology: string;
  researchGap: string;
}

class DocumentProcessor {
  private static instance: DocumentProcessor;

  private constructor() {}

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  /**
   * Main pipeline for document ingestion
   */
  public async process(buffer: Buffer, fileName: string, userId: string): Promise<ProcessedDocument> {
    console.log(`[INGESTION] Starting pipeline for: ${fileName}`);
    
    // 1. EXTRACTION
    let rawText = '';
    if (fileName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      rawText = data.text;
      await parser.destroy();
    } else {
      rawText = buffer.toString('utf-8');
    }

    // 2. DOI & METADATA EXTRACTION (RegEx + AI)
    const doi = this.extractDOI(rawText);
    
    // 3. SEMANTIC CHUNKING
    const chunks = this.semanticChunking(rawText);
    
    // 4. INTELLIGENT UNDERSTANDING (Methodology, Variables, Gap)
    const understanding = await this.analyzeDocumentStructure(rawText.slice(0, 15000));

    // 5. VECTOR INDEXING
    await this.indexToVectorMemory(chunks, userId, fileName);

    // 6. GRAPH LINKING (Theories, Variables)
    await this.linkToKnowledgeGraph(understanding, fileName);

    return {
      title: understanding.title || fileName,
      doi,
      content: rawText,
      chunks,
      metadata: { fileName, size: buffer.length, processedAt: Date.now() },
      variables: understanding.variables,
      methodology: understanding.methodology,
      researchGap: understanding.researchGap
    };
  }

  private extractDOI(text: string): string | undefined {
    const doiRegex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/g;
    const match = text.match(doiRegex);
    return match ? match[0] : undefined;
  }

  private semanticChunking(text: string): string[] {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) > 2000) {
        chunks.push(currentChunk);
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + p;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    
    return chunks.filter(c => c.length > 100);
  }

  private async analyzeDocumentStructure(text: string) {
    const prompt = `Analyze this research document text and extract structured insights in INDONESIAN.
    
    TEXT PREVIEW:
    ${text.slice(0, 8000)}
    
    EXTRACT:
    1. Title (Judul)
    2. Methodology (Metodologi Penelitian)
    3. Main Variables (Variabel Utama)
    4. Research Gap (Celah Riset yang diidentifikasi penulis atau yang Anda temukan)
    5. Theoretical Framework (Kerangka Teori)
    
    Format as JSON:
    {
      "title": "",
      "methodology": "",
      "variables": [],
      "researchGap": "",
      "theory": ""
    }`;

    try {
      const res = await smartOrchestrator.execute({
        prompt,
        type: 'analysis',
        importance: 'high',
        userId: 'system'
      });
      
      // Basic JSON cleaner
      const jsonStr = res.text.match(/\{[\s\S]*\}/)?.[0] || '{}';
      return JSON.parse(jsonStr);
    } catch (err) {
      return {
        title: 'Unknown Document',
        methodology: 'Tidak terdeteksi',
        variables: [],
        researchGap: 'Analisis kognitif gagal',
        theory: ''
      };
    }
  }

  private async indexToVectorMemory(chunks: string[], userId: string, fileName: string) {
    console.log(`[VECTOR] Indexing ${chunks.length} chunks for ${fileName}`);
    for (const chunk of chunks.slice(0, 50)) { // Limit initial indexing for speed
      const embedding = await embeddingService.getEmbedding(chunk);
      await ISAGIMemory.storeLTM({
        concept: `${fileName}: ${chunk.slice(0, 50)}...`,
        summary: chunk,
        embedding,
        relatedConcepts: [fileName],
        sourcePaperIds: [fileName],
        confidence: 'high',
        tags: ['document_chunk', fileName]
      });
    }
  }

  private async linkToKnowledgeGraph(understanding: any, fileName: string) {
    const concept = understanding.title || fileName;
    
    // Link variables to document
    for (const v of understanding.variables || []) {
      await ISAGIMemory.addSemanticEdge({
        from: concept.toLowerCase(),
        to: v.toLowerCase(),
        relation: 'uses_variable',
        weight: 0.9
      });
    }

    // Link methodology
    if (understanding.methodology) {
      await ISAGIMemory.addSemanticEdge({
        from: concept.toLowerCase(),
        to: understanding.methodology.toLowerCase().slice(0, 50),
        relation: 'uses_methodology',
        weight: 0.8
      });
    }
  }
}

export const documentProcessor = DocumentProcessor.getInstance();
