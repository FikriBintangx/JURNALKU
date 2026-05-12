import { geminiService } from '../geminiService';
import { vectorMemory } from '../workspace/vectorMemory';
import { ISAGIReasoningEngine } from './reasoningEngine';

export interface StreamCallbacks {
  onStatus: (status: string) => void;
  onAgentActivity: (agent: string, activity: string) => void;
  onToken: (token: string) => void;
  onGapDetected: (gap: string) => void;
  onGraphUpdate: (graphData: string) => void;
}

/**
 * Level 5 Streaming Orchestrator & Multi-Agent Engine
 * Runs parallel AI agents and streams their thoughts and final synthesis via SSE.
 */
export const streamingOrchestrator = {
  async runWorkspaceSession(
    userId: string,
    query: string,
    mode: string,
    callbacks: StreamCallbacks
  ) {
    try {
      callbacks.onStatus('Menganalisis niat riset...');
      
      // 1. Intent Classification
      const intent = ISAGIReasoningEngine.classifyIntent(query);
      callbacks.onStatus(`Intent terdeteksi: ${intent.primary}. Membangun strategi riset...`);

      // 2. Vector Memory Retrieval (Agent 1: Retriever)
      callbacks.onAgentActivity('retriever', 'Mencari memori semantik di database lokal...');
      const memories = await vectorMemory.recall(userId, query, 6);
      
      let contextStr = '';
      if (memories.length > 0) {
        callbacks.onAgentActivity('retriever', `Ditemukan ${memories.length} potongan jurnal relevan.`);
        contextStr = memories.map((m, i) => `[Dokumen: ${m.documentTitle} | Bagian: ${m.section}]\n${m.content}`).join('\n\n');
      } else {
        callbacks.onAgentActivity('retriever', 'Belum ada memori relevan. Mengandalkan pengetahuan dasar.');
      }

      callbacks.onStatus('Memulai debat Multi-Agent untuk validasi temuan...');

      // 3. Multi-Agent Parallel Processing
      // Agent 2: Critic (Looks for gaps, limitations, contradictions in the context)
      callbacks.onAgentActivity('critic', 'Menganalisis celah dan kelemahan metodologi...');
      const criticPromise = geminiService.generateAI({
        paperId: 'workspace-critic',
        type: 'intelligence',
        prompt: `Anda adalah Agent Kritikus Riset. Analisis konteks ini dan temukan celah, kontradiksi, atau kelemahan metodologi. Berikan 3 poin singkat. Konteks: ${contextStr.slice(0, 4000)}`,
        title: 'Critic'
      }).catch(() => ({ data: 'Tidak ada celah signifikan yang terdeteksi.' }));

      // Agent 3: Graph Extractor (Extracts entities for the Knowledge Graph)
      callbacks.onAgentActivity('graph', 'Memetakan relasi variabel dan teori...');
      const graphPromise = geminiService.generateAI({
        paperId: 'workspace-graph',
        type: 'intelligence',
        prompt: `Ekstrak variabel utama, teori, dan metode dari konteks ini ke dalam format daftar CSV (Variabel: X, Teori: Y). Konteks: ${contextStr.slice(0, 4000)}`,
        title: 'Graph'
      }).catch(() => ({ data: '' }));

      const [criticRes, graphRes] = await Promise.all([criticPromise, graphPromise]);
      
      callbacks.onGapDetected(criticRes?.data || '');
      callbacks.onGraphUpdate(graphRes?.data || '');

      callbacks.onAgentActivity('critic', 'Kritik selesai.');
      callbacks.onAgentActivity('graph', 'Entitas dipetakan.');
      callbacks.onStatus('Menyintesis laporan akhir secara streaming...');
      callbacks.onAgentActivity('synthesizer', 'Sedang menulis sintesis...');

      // 4. Final Synthesis Streaming (Agent 4: Synthesizer)
      let taskInstruction = `Sintesiskan jawaban yang komprehensif, akademik, gunakan bahasa Indonesia yang baku. Referensikan judul jurnal dari konteks. Sisipkan bagian khusus "Tinjauan Celah Riset" berdasarkan kritik di atas.`;
      
      if (mode === 'review') {
        taskInstruction = `Buatlah draf Tinjauan Pustaka (Literature Review) formal berdasarkan konteks di bawah. 
Struktur wajib:
1. Pendahuluan (Latar Belakang Isu)
2. Penelitian Terdahulu (Sintesis dari dokumen)
3. Gap Penelitian (Gunakan data dari Kritik)
4. Kesimpulan Sementara
Bahasa Indonesia akademik formal. Gunakan format Markdown.`;
      } else if (mode === 'compare') {
        taskInstruction = `Buatlah MATRIKS PERBANDINGAN mendalam antar dokumen yang ada di konteks. 
Fokus pada:
1. Perbedaan Metodologi
2. Perbedaan Variabel
3. Kontradiksi Temuan (Gunakan data dari Kritik)
Sajikan dalam format perbandingan terstruktur (menggunakan bullet points atau tabel markdown jika memungkinkan) dan berikan kesimpulan sintesis.`;
      }

      const synthesisPrompt = `Anda adalah ISAGI, Asisten Riset AI. 
      
PERTANYAAN/FOKUS: ${query}

KONTEKS JURNAL:
${contextStr}

KRITIK/CELAH RISET (Dari Agent Kritikus):
${criticRes?.data || ''}

Tugas Anda: ${taskInstruction}`;

      // Since the current geminiService doesn't expose raw streaming, we will mock the stream 
      // by fetching the full result and streaming it out artificially, OR if the genAI client supports it,
      // we could stream natively. For this implementation, we simulate the stream chunks.
      const synthesisRes = await geminiService.generateAI({
        paperId: 'workspace-synth',
        type: 'intelligence',
        prompt: synthesisPrompt,
        title: 'Synthesis'
      });

      const fullText = synthesisRes?.data || "Maaf, saya tidak dapat menghasilkan sintesis saat ini.";
      
      // Simulate token streaming for the UI
      const chunks = fullText.match(/.{1,15}(\s|$)/g) || [fullText];
      for (const chunk of chunks) {
        callbacks.onToken(chunk);
        await new Promise(r => setTimeout(r, 20)); // 20ms per chunk for natural reading speed
      }

      callbacks.onStatus('Sintesis selesai.');
      callbacks.onAgentActivity('synthesizer', 'Idle');

    } catch (error: any) {
      console.error('[STREAM_ORCHESTRATOR] Error:', error);
      callbacks.onStatus('Terjadi kesalahan pada sistem otonom.');
    }
  }
};
