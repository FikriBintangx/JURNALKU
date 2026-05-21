import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager } from "./AIKeyManager";
import { providerHealth } from "./arai/providerHealth";
import { executeProviderSafely, SafeInferenceResult } from "./arai/providerUtils";

const PRIMARY_MODEL = "gemini-2.0-flash";
const AI_TIMEOUT_MS = 25000; 

const generationConfig: GenerationConfig = {
  temperature: 0.4,
  topP: 0.85,
  topK: 40,
  maxOutputTokens: 4096,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

interface AIRequest {
  paperId: string;
  type: string;
  prompt: string;
  abstract?: string;
  title?: string;
  model?: string;
}

/**
 * GEMINI SERVICE (Unified Version)
 * 
 * Acting as the legacy entry point for all API routes, this service now 
 * delegates to the Intelligent Smart Orchestrator to ensure correct provider 
 * selection, health checks, and fallback logic.
 */
export const geminiService = {
  /**
   * LEGACY ENTRY POINT
   * Dynamically routes to the orchestrator. This fixes all existing API routes
   * that call geminiService directly.
   */
  async generateAI(req: AIRequest): Promise<any> {
    const { paperId, type, model, prompt, abstract, title } = req;
    
    // 1. Check Cache First
    const cacheKey = `ai:v3:${type}:${paperId}${model ? `:${model.split('/').pop()}` : ''}`;
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached, cached: true };
      } catch (e) {}
    }

    // 2. Delegate to Smart Orchestrator
    // We use dynamic import to avoid circular dependency
    const { smartOrchestrator } = await import('./arai/smartOrchestrator');
    
    const result = await smartOrchestrator.execute({
      prompt: `Judul: ${title || ''}\nAbstrak: ${abstract || ''}\n\nTugas: ${prompt}`,
      type: type as any,
      importance: 'standard',
      userId: 'system',
      paperId: paperId,
      modelId: model
    });

    // 3. Cache Success
    if (result.success && redis && result.text) {
      await redis.set(cacheKey, result.text, { ex: 60 * 60 * 24 * 7 }).catch(() => {});
    }

    return {
      success: result.success,
      data: result.text,
      provider: result.provider,
      model: result.model,
      fallback: result.isDegraded || result.fallback || false,
      intelligence: result.intelligence
    };
  },

  /**
   * NATIVE GEMINI EXECUTION (Strictly Gemini only)
   * Called by the Orchestrator.
   */
  async executeInternal(req: { prompt: string, model: string }): Promise<SafeInferenceResult> {
    const maxRetries = Math.min(3, aiKeyManager.getHealthyCount());
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiKey = aiKeyManager.getBestKey();
      if (!apiKey) break;

      const geminiModelId = req.model.includes('/') ? req.model.split('/').pop()! : req.model;
      const t0 = Date.now();

      try {
        const result = await executeProviderSafely('gemini', geminiModelId, async () => {
          const genAI = new GoogleGenerativeAI(apiKey);
          const gModel = genAI.getGenerativeModel({ 
            model: geminiModelId, 
            generationConfig, 
            safetySettings 
          });
          
          const response = await Promise.race([
            gModel.generateContent(req.prompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), AI_TIMEOUT_MS))
          ]) as any;

          const text = response?.response?.text?.();
          if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');
          return text;
        });

        if (result.success) {
          const estTokens = Math.ceil((req.prompt.length + result.data.length) / 4);
          aiKeyManager.markSuccess(apiKey, estTokens);
          providerHealth.reportSuccess('gemini', Date.now() - t0);
          return result;
        }

        // Key failed — mark and potentially retry
        const isRateLimit = result.errorType === 'RATE_LIMIT';
        aiKeyManager.markFailure(apiKey, isRateLimit);
        lastError = result;

        if (!result.retryable) break;
        console.warn(`[GEMINI] Key failed (Attempt ${attempt + 1}/${maxRetries}). Retrying with next key...`);

      } catch (err: any) {
        aiKeyManager.markFailure(apiKey, false);
        lastError = { message: err.message };
      }
    }

    return { 
      success: false, 
      data: '', 
      provider: 'gemini', 
      model: req.model, 
      message: lastError?.message || 'GEMINI_ALL_KEYS_FAILED',
      retryable: false
    };
  },

  /**
   * STREAMING EXECUTION (Gemini only)
   */
  async *executeStreamInternal(req: { prompt: string, model: string }): AsyncGenerator<string> {
    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) {
      yield "ERROR: No healthy API keys available.";
      return;
    }

    const geminiModelId = req.model.includes('/') ? req.model.split('/').pop()! : req.model;
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gModel = genAI.getGenerativeModel({ 
        model: geminiModelId, 
        generationConfig, 
        safetySettings 
      });
      
      const result = await gModel.generateContentStream(req.prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
      
      aiKeyManager.markSuccess(apiKey);
    } catch (err: any) {
      console.error("[GEMINI_STREAM] Error:", err.message);
      yield `[ERROR: ${err.message}]`;
    }
  }
};
