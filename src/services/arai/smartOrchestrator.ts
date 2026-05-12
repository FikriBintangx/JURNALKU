/**
 * ISAGI INTELLIGENT PROVIDER ORCHESTRATOR (v3)
 * 
 * The central brain for AI inference routing. Implements smart failover,
 * provider-agnostic execution, and adaptive degradation (Retrieval-Augmented Fallback).
 */

import { ProviderType, providerHealth } from "./providerHealth";
import { modelRegistry } from "./modelRegistry";
import { geminiService } from "../geminiService";
import { callGroq } from "../groqService";
import { callOpenRouter } from "../openRouterService";
import { SafeInferenceResult } from "./providerUtils";
import { responseFormatter } from "./formatter";
import { literatureService, AcademicPaper } from "../literatureService";

export interface InferenceRequest {
  prompt: string;
  type: string;
  importance: 'high' | 'standard' | 'low';
  userId: string;
  paperId?: string;
  modelId?: string; // Explicit model selection from UI
  title?: string;
  abstract?: string;
}

export interface InferenceResponse {
  text: string;
  success: boolean;
  provider: ProviderType | 'fallback';
  model: string;
  latency: number;
  isDegraded: boolean;
  fallback?: boolean;
  message?: string;
  intelligence?: {
    evidenceCount: number;
    task: string;
    latency: number;
    orchestrator: string;
  };
}

class IntelligentProviderOrchestrator {
  private static instance: IntelligentProviderOrchestrator;

  private constructor() {}

  public static getInstance(): IntelligentProviderOrchestrator {
    if (!IntelligentProviderOrchestrator.instance) {
      IntelligentProviderOrchestrator.instance = new IntelligentProviderOrchestrator();
    }
    return IntelligentProviderOrchestrator.instance;
  }

  /**
   * GET STATUS SUMMARY
   * Returns a human-readable status of the entire AI orchestration layer.
   */
  public getStatusSummary(): string {
    return providerHealth.getStatusSummary();
  }

  /**
   * EXECUTE TASK
   * Main entry point for all AI tasks in the system.
   */
  public async execute(req: InferenceRequest): Promise<InferenceResponse> {
    const t0 = Date.now();
    
    // 1. Determine Target Provider & Model
    let targetModel = req.modelId || 'isagi-autonomous';
    let targetProvider: ProviderType;

    if (targetModel === 'isagi-autonomous') {
      const bestProvider = providerHealth.getBestProvider(['gemini', 'groq', 'openrouter']);
      targetProvider = bestProvider || 'gemini';
      targetModel = modelRegistry.getBestModel(targetProvider) || 'gemini-1.5-flash';
    } else {
      targetProvider = modelRegistry.getProviderForModel(targetModel);
    }

    console.log(`[ORCHESTRATOR] Routing task [${req.type}] to ${targetProvider.toUpperCase()} (${targetModel})`);

    // 2. Perform Autonomous Retrieval (Evidence Gathering)
    const evidence = await this.retrieveEvidence(req);
    const evidenceContext = literatureService.formatContext(evidence);

    // 3. Prepare Enhanced Prompt
    const taskSpecificInstruction = this.getTaskInstruction(req.type);
    const enhancedPrompt = `
      SISTEM: ISAGI Autonomous Scientific Orchestrator (V3)
      TUGAS: ${req.type.toUpperCase()}
      
      KONTEKS PENELITIAN:
      ${req.prompt}
      
      BUKTI LITERATUR REAL-TIME:
      ${evidenceContext}
      
      INSTRUKSI KHUSUS:
      ${taskSpecificInstruction}
      
      ${responseFormatter.getSystemPromptInjection()}
    `;

    // 4. Attempt Execution with Failover Chain
    const result = await this.executeWithFailover(req, targetProvider, targetModel, enhancedPrompt);

    if (!result.success) {
      // 5. RETRIEVAL-AUGMENTED FALLBACK (LAST RESORT)
      console.warn(`[ORCHESTRATOR] ALL AI PROVIDERS FAILED. Activating Retrieval Fallback Mode.`);
      const fallbackResult = this.synthesizeFromEvidence(evidence, req.type);
      return {
        text: fallbackResult.data,
        success: fallbackResult.success,
        provider: 'fallback',
        model: 'heuristic-synthesis',
        latency: Date.now() - t0,
        isDegraded: true,
        fallback: true
      };
    }

    // 6. Final Normalization
    return {
      text: responseFormatter.format(result.data),
      success: true,
      provider: result.provider,
      model: result.model,
      latency: Date.now() - t0,
      isDegraded: false,
      intelligence: {
        evidenceCount: evidence.length,
        task: req.type,
        latency: Date.now() - t0,
        orchestrator: 'ARI-V3-Autonomous'
      }
    };
  }

  /**
   * SYNTHESIZE FROM EVIDENCE (Last Resort Fallback)
   */
  private synthesizeFromEvidence(evidence: any[], type: string) {
    if (!evidence || evidence.length === 0) {
      return { 
        success: false, 
        data: "Maaf, seluruh provider AI sedang mengalami gangguan kuota (429/500). Sistem pencarian metadata juga tidak menemukan referensi yang cukup untuk membuat ringkasan manual. Mohon coba beberapa menit lagi."
      };
    }

    const top = evidence[0];
    const data = `[MODE CADANGAN AKTIF] Berdasarkan data literatur yang ditemukan: "${top.title || 'Penelitian terkait'}". 
Studi ini diterbitkan pada tahun ${top.year || 'N/A'} oleh ${top.authors?.[0]?.name || 'peneliti utama'}. 
Fokus utama mencakup ${top.topics?.slice(0,3).join(', ') || 'topik terkait'}. 
(Catatan: Ringkasan ini dihasilkan secara otomatis melalui ekstraksi metadata karena seluruh layanan AI (Gemini/Groq/OR) sedang dalam pemulihan).`;

    return { success: true, data };
  }

  private async executeWithFailover(req: InferenceRequest, initialProvider: ProviderType, initialModel: string, prompt: string): Promise<SafeInferenceResult> {
    const fallbackChain: { provider: ProviderType, model: string }[] = [
      { provider: initialProvider, model: initialModel },
      { provider: 'gemini', model: 'gemini-1.5-flash' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      { provider: 'openrouter', model: 'google/gemini-2.0-flash-001' }
    ];

    // Unique chain, respecting health
    const uniqueChain = fallbackChain.filter((v, i, a) => 
      a.findIndex(t => t.provider === v.provider) === i && providerHealth.isHealthy(v.provider)
    );

    for (const link of uniqueChain) {
      console.log(`[ORCHESTRATOR] Attempting execution with ${link.provider.toUpperCase()} (${link.model})`);
      
      try {
        const result = await this.callProviderService(link.provider, link.model, prompt, req);
        
        if (result.success) {
          console.log(`[ORCHESTRATOR] SUCCESS with ${link.provider.toUpperCase()}`);
          return result;
        }

        providerHealth.reportFailure(link.provider, result.message || 'Unknown Error');
        console.warn(`[ORCHESTRATOR] ${link.provider.toUpperCase()} failed: ${result.message}. Trying next fallback...`);
      } catch (err: any) {
        providerHealth.reportFailure(link.provider, err.message);
      }
    }

    return { success: false, data: '', provider: 'none', model: 'none' };
  }

  private async callProviderService(provider: ProviderType, model: string, prompt: string, req: InferenceRequest): Promise<SafeInferenceResult> {
    const aiReq = {
      paperId: req.paperId || 'global',
      type: req.type,
      prompt: prompt,
      model: model
    };

    switch (provider) {
      case 'gemini':
        return await geminiService.executeInternal(aiReq);
      case 'groq':
        try {
          const text = await callGroq(prompt, model);
          return { success: true, data: text, provider: 'groq', model };
        } catch (e: any) {
          return { success: false, data: '', provider: 'groq', model, message: e.message, retryable: true };
        }
      case 'openrouter':
        const { executeOpenRouterInternal } = await import("../openRouterService");
        return await executeOpenRouterInternal(prompt, model);
      default:
        return { success: false, data: '', provider, model, message: 'UNSUPPORTED_PROVIDER' };
    }
  }

  private async retrieveEvidence(req: InferenceRequest): Promise<AcademicPaper[]> {
    const complexTasks = ['summary', 'analysis', 'gap', 'future-research', 'intelligence', 'web-research'];
    if (!complexTasks.includes(req.type)) return [];

    try {
      const textToAnalyze = (req.title || req.prompt || '').toLowerCase();
      const stopWords = new Set(['dan', 'yang', 'untuk', 'dengan', 'pada', 'adalah', 'the', 'and', 'for', 'with', 'on', 'in', 'of', 'a', 'is']);
      
      const searchKeywords = textToAnalyze
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .slice(0, 6)
        .join(' ');

      if (!searchKeywords) return [];
      return await literatureService.search(searchKeywords, 4);
    } catch (e) {
      return [];
    }
  }

  private getTaskInstruction(type: string): string {
    const instructions: Record<string, string> = {
      'gap': 'Identifikasi celah penelitian mendalam. Bandingkan dengan paper terkait untuk menemukan variabel yang belum dieksplorasi.',
      'future-research': 'Prediksi tren penelitian masa depan berdasarkan trajektori literatur pendukung.',
      'summary': 'Buat ringkasan akademik eksekutif yang memposisikan paper ini dalam konteks literatur global.',
      'intelligence': 'Hubungkan temuan penelitian ini dengan kerangka teori yang ada.',
      'explainer': 'Jelaskan konsep penelitian ini dengan bahasa yang adaptif namun tetap ilmiah.',
    };
    return instructions[type] || 'Lakukan analisis ilmiah objektif berdasarkan konteks yang diberikan.';
  }
}

export const smartOrchestrator = IntelligentProviderOrchestrator.getInstance();
