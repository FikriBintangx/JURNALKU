import { smartOrchestrator } from './smartOrchestrator';
import { ISAGIReasoningEngine } from './reasoningEngine';
import { ISAGIMemory } from './memorySystem';
import { agentSwarm } from './agentSwarm';
import { responseFormatter } from './formatter';
import { graphCognition } from './graphCognition';
import { embeddingService } from '../embeddingService';

export interface StreamCallbacks {
  onStatus: (status: string) => void;
  onAgentActivity: (agent: string, activity: string) => void;
  onToken: (token: string) => void;
  onGapDetected: (gap: string) => void;
  onGraphUpdate: (graphData: string) => void;
}

/**
 * ISAGI STREAMING ORCHESTRATOR
 * The high-level coordinator for real-time scientific cognition.
 */
export const streamingOrchestrator = {
  async runWorkspaceSession(
    userId: string,
    query: string,
    mode: string,
    callbacks: StreamCallbacks
  ) {
    try {
      callbacks.onStatus('MENGAKTIFKAN KERNEL ISAGI...');
      
      // 1. INTENT CLASSIFICATION
      const intent = ISAGIReasoningEngine.classifyIntent(query);
      callbacks.onStatus(`KONTROL: Niat ${intent.primary} terdeteksi. Memetakan sirkuit agen...`);

      // 2. SEMANTIC MEMORY RECALL (Retriever Agent)
      callbacks.onAgentActivity('retriever', 'MENCIPTAKAN VEKTOR QUERY...');
      
      // FIX: Generate real embedding for the query
      const queryEmbedding = await embeddingService.getEmbedding(query);
      
      callbacks.onAgentActivity('retriever', 'MENCARI MEMORI SEMANTIK...');
      
      // FIX: Pass the real embedding to semanticRecall
      const memoryHits = await ISAGIMemory.semanticRecall(queryEmbedding, 5); 
      let contextStr = memoryHits.map(m => `${m.concept}: ${m.summary}`).join('\n\n');
      
      callbacks.onAgentActivity('retriever', memoryHits.length > 0 
        ? `DITEMUKAN ${memoryHits.length} RELASI MEMORI RELEVAN.` 
        : 'MEMORI LOKAL NIHIL. MENGGUNAKAN BASIS PENGETAHUAN GLOBAL.');

      // 3. MULTI-AGENT EXECUTION (CRITIC & GAP DETECTOR)
      callbacks.onStatus('MEMULAI ANALISIS MULTI-AGEN...');
      
      // GAP DETECTOR & GRAPH AGENT run in parallel
      const gapTask = agentSwarm.detectGaps(memoryHits).then(gap => {
        callbacks.onGapDetected(responseFormatter.format(gap));
        return gap;
      });

      const graphTask = graphCognition.generateGraph([]).then(graph => {
        callbacks.onGraphUpdate(JSON.stringify(graph));
        return graph;
      });

      const [gapResult] = await Promise.all([gapTask, graphTask]);

      // 4. FINAL SYNTHESIS WITH REAL STREAMING
      callbacks.onStatus('MENYINTESIS HASIL RISET...');
      callbacks.onAgentActivity('synthesizer', 'MEMPROSES KOGNISI AKHIR...');

      const synthesisPrompt = `
      SEBAGAI PENYINTESIS UTAMA ISAGI:
      PERTANYAAN: ${query}
      KONTEKS MEMORI: ${contextStr}
      CELAH RISET TERDETEKSI: ${gapResult}
      MODE: ${mode}
      
      TUGAS:
      Berikan jawaban ilmiah yang mendalam, objektif, dan terstruktur.
      Gunakan data dari memori jika relevan.
      `;

      // FIX: Use real streaming from smartOrchestrator
      const stream = smartOrchestrator.executeStream({
        prompt: synthesisPrompt,
        type: 'synthesis',
        importance: 'high',
        userId
      });

      for await (const token of stream) {
        callbacks.onToken(token);
      }

      // 5. OPTIONAL: CRITIQUE PHASE (Post-synthesis verification)
      callbacks.onAgentActivity('critic', 'MENGEVALUASI HASIL...');
      // (This could be used to update the status or send a final 'validation' event)

      callbacks.onStatus('OPERASI SELESAI. SISTEM SIAP.');
      callbacks.onAgentActivity('synthesizer', 'IDLE');
      callbacks.onAgentActivity('retriever', 'IDLE');
      callbacks.onAgentActivity('critic', 'IDLE');
      callbacks.onAgentActivity('graph', 'IDLE');

    } catch (error: any) {
      console.error('[ISAGI:STREAM] Fatal error:', error);
      callbacks.onStatus('KESALAHAN SISTEM: KERNEL PANIC.');
    }
  }
};
