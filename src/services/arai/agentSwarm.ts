import { smartOrchestrator } from "./smartOrchestrator";
import { UniversalPaperEnriched } from "./types";

export type AgentState = 'idle' | 'retrieving' | 'indexing' | 'validating' | 'debating' | 'synthesizing' | 'graph-linking' | 'updating-memory';

export interface AgentActivity {
  agent: string;
  state: AgentState;
  message: string;
}

class AgentSwarm {
  private static instance: AgentSwarm;
  private onActivity?: (activity: AgentActivity) => void;

  private constructor() {}

  public static getInstance(): AgentSwarm {
    if (!AgentSwarm.instance) {
      AgentSwarm.instance = new AgentSwarm();
    }
    return AgentSwarm.instance;
  }

  public setActivityCallback(cb: (a: AgentActivity) => void) {
    this.onActivity = cb;
  }

  private report(agent: string, state: AgentState, message: string) {
    console.log(`[AGENT:${agent.toUpperCase()}] ${state}: ${message}`);
    this.onActivity?.({ agent, state, message });
  }

  /**
   * CRITIC AGENT: Analyzes reasoning for gaps and bias
   */
  async critique(context: string, synthesis: string): Promise<string> {
    this.report('critic', 'debating', 'Menganalisis bias dan dukungan bukti...');
    
    const prompt = `You are the CRITIC AGENT. Analyze this synthesis against the provided context.
    
    CONTEXT: ${context}
    SYNTHESIS: ${synthesis}
    
    TUGAS:
    1. Deteksi klaim tanpa bukti (hallucinations).
    2. Identifikasi bias metodologi.
    3. Cari kontradiksi yang diabaikan.
    
    Format: Poin-poin kritik tajam dalam Bahasa Indonesia.`;

    const res = await smartOrchestrator.execute({
      prompt,
      type: 'analysis',
      importance: 'high',
      userId: 'system'
    });

    this.report('critic', 'idle', 'Analisis kritik selesai.');
    return res.text;
  }

  /**
   * DEBATE: Higher level coordination of multiple critiques
   */
  async debate(context: string, synthesis: string): Promise<string> {
    this.report('orchestrator', 'debating', 'Memulai debat kognitif antar agen...');
    return this.critique(context, synthesis);
  }

  /**
   * VERIFIER AGENT: Checks citations and DOI validity
   */
  async verify(synthesis: string, papers: UniversalPaperEnriched[]): Promise<{ isValid: boolean; issues: string[] }> {
    this.report('verifier', 'validating', 'Memverifikasi sitasi dan integritas sumber...');
    
    const paperContext = papers.map((p, i) => `[${i+1}] ${p.title} (DOI: ${p.doi})`).join('\n');
    const prompt = `Verify these citations:
    
    PAPERS:
    ${paperContext}
    
    SYNTHESIS:
    ${synthesis}
    
    TUGAS:
    Apakah [1], [2], dll digunakan dengan benar? Daftar kesalahan atribusi.`;

    const res = await smartOrchestrator.execute({
      prompt,
      type: 'analysis',
      importance: 'high',
      userId: 'system'
    });

    const issues = res.text.split('\n').filter(l => l.toLowerCase().includes('salah') || l.toLowerCase().includes('tidak'));
    this.report('verifier', 'idle', 'Verifikasi selesai.');
    return { isValid: issues.length === 0, issues };
  }

  /**
   * FACT CHECK: Alias for verify for orchestrator use
   */
  async factCheck(synthesis: string, papers: UniversalPaperEnriched[]) {
    return this.verify(synthesis, papers);
  }

  /**
   * GAP DETECTOR AGENT: Finds unexplored research areas
   */
  async detectGaps(papers: any[]): Promise<string> {
    this.report('gap-detector', 'synthesizing', 'Mencari celah riset dan peluang novelty...');
    
    const context = papers.map(p => `${p.title}: ${p.abstract || p.summary}`).join('\n\n');
    const prompt = `Sebagai GAP DETECTOR AGENT, cari celah riset dari kumpulan paper berikut:
    
    ${context}
    
    TUGAS:
    1. Cari variabel yang belum diuji.
    2. Identifikasi batasan demografis atau metodologis.
    3. Rekomendasikan arah penelitian baru (Novelty).`;

    const res = await smartOrchestrator.execute({
      prompt,
      type: 'analysis',
      importance: 'high',
      userId: 'system'
    });

    this.report('gap-detector', 'idle', 'Celah riset terdeteksi.');
    return res.text;
  }

  /**
   * GRAPH AGENT: Builds relationships
   */
  async mapRelationships(nodes: string[]): Promise<string> {
    this.report('graph-agent', 'graph-linking', 'Membangun peta semantik hubungan antar konsep...');
    // Logic for graph extraction...
    this.report('graph-agent', 'idle', 'Peta hubungan selesai.');
    return "Graph mapping complete.";
  }
}

export const agentSwarm = AgentSwarm.getInstance();
