import { ResearchCognition } from './schemas';

export class ResearchCognitionEngine {
  private static instance: ResearchCognitionEngine;
  private sessionMemory: Map<string, ResearchCognition> = new Map();

  private constructor() {}

  public static getInstance(): ResearchCognitionEngine {
    if (!ResearchCognitionEngine.instance) {
      ResearchCognitionEngine.instance = new ResearchCognitionEngine();
      ResearchCognitionEngine.instance.loadFromStorage();
    }
    return ResearchCognitionEngine.instance;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('research_cognition_brain');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, val]) => {
          this.sessionMemory.set(key, val as ResearchCognition);
        });
      }
    } catch (err) {
      console.error('Failed to load shared brain', err);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    const data = Object.fromEntries(this.sessionMemory.entries());
    localStorage.setItem('research_cognition_brain', JSON.stringify(data));
    window.dispatchEvent(new Event('cognition_sync'));
  }

  public setCognition(paperId: string, data: ResearchCognition) {
    this.sessionMemory.set(paperId, data);
    this.persist();
  }

  public getCognition(paperId: string): ResearchCognition | undefined {
    return this.sessionMemory.get(paperId);
  }

  public getGlobalBrain(): ResearchCognition[] {
    return Array.from(this.sessionMemory.values());
  }

  public getRelatedNodes(paperId: string): string[] {
    const current = this.getCognition(paperId);
    if (!current) return [];
    
    const related: string[] = [];
    this.sessionMemory.forEach((cog, id) => {
      if (id === paperId) return;
      
      // Shared domain or common entities
      const hasSharedDomain = cog.domain === current.domain;
      const sharedEntities = cog.entities.filter(e => 
        current.entities.some(ce => ce.label.toLowerCase() === e.label.toLowerCase())
      );

      if (hasSharedDomain || sharedEntities.length > 0) {
        related.push(id);
      }
    });
    return related;
  }

  public generateReasoningChain(data: ResearchCognition): string[] {
    const chain: string[] = [];
    
    chain.push(`Inisialisasi klaster neural untuk domain: ${data.domain}`);
    
    // Cross-agent intelligence signal
    const related = this.getRelatedNodes(data.paperId || '');
    if (related.length > 0) {
      chain.push(`Sinkronisasi dengan ${related.length} node riset terkait di memori global`);
    }

    data.entities.slice(0, 3).forEach(e => {
      chain.push(`Pemetaan entitas strategis: ${e.label} [${e.type}]`);
    });

    data.methodologies.forEach(m => {
      chain.push(`Audit metodologi [${m.name}]: Skor Rigoritas ${m.rigor}/100`);
    });

    if (data.noveltySignals.length > 0) {
      chain.push(`Diferensiasi SOTA: ${data.noveltySignals[0]}`);
    }

    return chain;
  }

  public calculateConfidence(data: ResearchCognition): number {
    const base = data.confidenceEngine.score;
    const penalty = data.confidenceEngine.limitations.length * 2;
    const collaborationBonus = this.getRelatedNodes(data.paperId || '').length * 5;
    return Math.max(0, Math.min(100, base - penalty + collaborationBonus));
  }
}

export const cognitionEngine = ResearchCognitionEngine.getInstance();
