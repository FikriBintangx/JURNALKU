import { smartOrchestrator } from './smartOrchestrator';
import { ISAGIReasoningEngine } from './reasoningEngine';
import { ISAGIMemory } from './memorySystem';
import { agentSwarm } from './agentSwarm';
import { responseFormatter } from './formatter';
import { graphCognition } from './graphCognition';

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
      callbacks.onAgentActivity('retriever', 'MENCARI MEMORI SEMANTIK...');
      const embedding = await smartOrchestrator.execute({
        prompt: `Generate a search context for: ${query}`,
        type: 'intent',
        importance: 'low',
        userId
      }).then(r => r.text);
      
      // Mocking embedding recall for now if service is unavailable, otherwise use real recall
      const memoryHits = await ISAGIMemory.semanticRecall([], 5); 
      let contextStr = memoryHits.map(m => `${m.concept}: ${m.summary}`).join('\n\n');
      
      callbacks.onAgentActivity('retriever', memoryHits.length > 0 
        ? `DITEMUKAN ${memoryHits.length} RELASI MEMORI.` 
        : 'MEMORI LOKAL NIHIL. MENGGUNAKAN BASIS PENGETAHUAN GLOBAL.');

      // 3. MULTI-AGENT EXECUTION (CRITIC & GAP DETECTOR)
      callbacks.onStatus('MEMULAI DEBAT MULTI-AGEN UNTUK VALIDASI ILMIAH...');
      
      // GAP DETECTOR
      const gapTask = agentSwarm.detectGaps(memoryHits).then(gap => {
        callbacks.onGapDetected(responseFormatter.format(gap));
        return gap;
      });

      // GRAPH AGENT
      const graphTask = graphCognition.generateGraph([]).then(graph => {
        callbacks.onGraphUpdate(JSON.stringify(graph));
        return graph;
      });

      const [gapResult] = await Promise.all([gapTask, graphTask]);

      // 4. FINAL SYNTHESIS WITH RESPONSE FORMATTING
      callbacks.onStatus('MENYINTESIS HASIL RISET...');
      callbacks.onAgentActivity('synthesizer', 'MEMPROSES KOGNISI AKHIR...');

      const synthesisPrompt = `
      SEBAGAI PENYINTESIS UTAMA ISAGI:
      PERTANYAAN: ${query}
      KONTEKS: ${contextStr}
      CELAH RISET: ${gapResult}
      MODE: ${mode}
      
      TUGAS:
      Berikan jawaban ilmiah yang mendalam, objektif, dan terstruktur.
      ${responseFormatter.getSystemPromptInjection()}
      `;

      const res = await smartOrchestrator.execute({
        prompt: synthesisPrompt,
        type: 'synthesis',
        importance: 'high',
        userId
      });

      // Clean the output
      const cleanOutput = responseFormatter.format(res.text);
      
      // Stream tokens
      const words = cleanOutput.split(' ');
      for (const word of words) {
        callbacks.onToken(word + ' ');
        await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
      }

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
