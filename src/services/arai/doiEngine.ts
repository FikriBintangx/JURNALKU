import axios from 'axios';

export interface DOIResult {
  doi: string;
  title: string;
  authors: string[];
  publisher: string;
  year?: number;
  references: string[];
  abstract?: string;
  source: string;
}

class DOIIntelligenceEngine {
  private static instance: DOIIntelligenceEngine;

  private constructor() {}

  public static getInstance(): DOIIntelligenceEngine {
    if (!DOIIntelligenceEngine.instance) {
      DOIIntelligenceEngine.instance = new DOIIntelligenceEngine();
    }
    return DOIIntelligenceEngine.instance;
  }

  /**
   * Resolves DOI using Crossref and OpenAlex
   */
  public async resolve(doi: string): Promise<DOIResult | null> {
    console.log(`[DOI] Resolving: ${doi}`);
    
    try {
      // 1. TRY CROSSREF
      const crossref = await this.queryCrossref(doi);
      if (crossref) return crossref;

      // 2. TRY OPENALEX FALLBACK
      const openAlex = await this.queryOpenAlex(doi);
      if (openAlex) return openAlex;

      return null;
    } catch (err) {
      console.error(`[DOI] Failed to resolve ${doi}:`, err);
      return null;
    }
  }

  private async queryCrossref(doi: string): Promise<DOIResult | null> {
    try {
      const res = await axios.get(`https://api.crossref.org/works/${doi}`, {
        headers: { 'User-Agent': 'ISAGI-Research-OS/1.0 (mailto:admin@isagi.ai)' }
      });
      
      const item = res.data.message;
      return {
        doi,
        title: item.title?.[0] || 'Unknown Title',
        authors: (item.author || []).map((a: any) => `${a.given} ${a.family}`),
        publisher: item.publisher || 'Unknown Publisher',
        year: item.issued?.['date-parts']?.[0]?.[0],
        references: (item.reference || []).map((r: any) => r.DOI || r.unstructured).filter(Boolean),
        abstract: item.abstract,
        source: 'Crossref'
      };
    } catch {
      return null;
    }
  }

  private async queryOpenAlex(doi: string): Promise<DOIResult | null> {
    try {
      const cleanDoi = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      const res = await axios.get(`https://api.openalex.org/works/${cleanDoi}`);
      
      const item = res.data;
      return {
        doi,
        title: item.display_name || 'Unknown Title',
        authors: (item.authorships || []).map((a: any) => a.author.display_name),
        publisher: item.host_venue?.publisher || 'Unknown Publisher',
        year: item.publication_year,
        references: item.referenced_works || [],
        abstract: '', // OpenAlex usually doesn't give full abstract in simple GET
        source: 'OpenAlex'
      };
    } catch {
      return null;
    }
  }
}

export const doiEngine = DOIIntelligenceEngine.getInstance();
