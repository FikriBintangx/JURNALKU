import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager, classifyAIError } from "./AIKeyManager";
import { callOpenRouter } from "./openRouterService";
import { callHuggingFace } from "./huggingFaceService";
import { callGroq, GROQ_MODELS } from "./groqService";
import { ISAGIOrchestrator } from "./arai/orchestrator";
import { providerHealth } from "./arai/providerHealth";

// PRIMARY model — gemini-2.0-flash (latest stable)
const PRIMARY_MODEL = "gemini-2.0-flash";
const FALLBACK_MODEL = "gemini-1.5-flash-latest";
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

// Concurrency limiter
let activeRequests = 0;
const MAX_CONCURRENT = 5;
const queue: (() => void)[] = [];

const processQueue = () => {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift();
    if (next) { activeRequests++; next(); }
  }
};

/**
 * INTELLIGENT DEGRADATION SYSTEM
 * Replaces static fake text with real data-backed fallback logic.
 */
function handleDegradedMode(type: string, title: string, abstract: string): string {
  const ab = (abstract || '').slice(0, 1000);
  
  const headers: Record<string, string> = {
    summary: `Ringkasan Penelitian (Mode Terdegradasi)`,
    gap: `Potensi Celah Riset (Berdasarkan Data)`,
    citation: `Sitasi Akademik (Otomatis)`,
  };

  const header = headers[type] || `${type.toUpperCase()} (Mode Terdegradasi)`;

  const output = `${header}

Catatan: Sintesis AI tingkat lanjut saat ini tidak tersedia karena batas kuota penyedia. Sistem beralih ke Mode Ringan (ekstraksi data langsung).

Data Sumber
Judul: ${title}
Abstrak Teridentifikasi: ${ab || 'Tidak ada abstrak tersedia.'}

Analisis Awal
- Domain: Riset Akademik
- Konteks: Dokumen ini membahas tentang ${title.split(' ').slice(0, 5).join(' ')}.
- Status: Sintesis AI sedang dalam antrean. Silakan coba lagi dalam 3-5 menit untuk analisis kognitif mendalam.

---
Kernel Otonom ISAGI — Tingkat Resiliensi 5 Aktif`;

  return output.replace(/[#*]/g, '');
}

export const geminiService = {
  async generateAI({ paperId, type, prompt, abstract, title, model }: AIRequest): Promise<any> {
    if (!paperId || !type) return { success: false, message: "Missing fields" };

    const cacheKey = `ai:v3:${type}:${paperId}${model ? `:${model.split('/').pop()}` : ''}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached, cached: true };
      } catch (e) {}
    }

    return new Promise((resolve) => {
      const execute = async () => {
        try {
          const result = await this.executeWithRetry({ paperId, type, prompt, abstract, title, model });
          if (result.success && !result.fallback && redis && result.data) {
            await redis.set(cacheKey, result.data, { ex: 60 * 60 * 24 * 7 }).catch(() => {});
          }
          resolve(result);
        } finally {
          activeRequests--;
          processQueue();
        }
      };

      if (activeRequests < MAX_CONCURRENT) {
        activeRequests++;
        execute();
      } else {
        queue.push(execute);
      }
    });
  },

  async executeWithRetry(req: AIRequest, attempt: number = 1): Promise<any> {
    const { abstract, title, prompt, type, model, paperId } = req;

    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) throw new Error('GEMINI_NO_KEY_AVAILABLE');

    const fullPrompt = `Judul: ${title}\nAbstrak: ${abstract}\n\nTugas: ${prompt}\n\nINSTRUKSI PENTING: JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN PERNAH MENGGUNAKAN SIMBOL MARKDOWN SEPERTI # ATAU * DALAM JAWABAN ANDA. Gunakan baris baru untuk struktur.`;

    const t0 = Date.now();
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gModel = genAI.getGenerativeModel({ model: model || PRIMARY_MODEL, generationConfig, safetySettings });
      
      const result = await Promise.race([
        gModel.generateContent(fullPrompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), AI_TIMEOUT_MS))
      ]) as any;

      const text = result?.response?.text?.();
      if (text) {
        // Estimate tokens (approx 4 chars per token)
        const estTokens = Math.ceil((fullPrompt.length + text.length) / 4);
        aiKeyManager.markSuccess(apiKey, estTokens);
        return { success: true, data: text.replace(/[#*]/g, ''), provider: 'gemini' };
      }
      throw new Error('GEMINI_EMPTY_RESPONSE');
    } catch (err: any) {
      const errType = classifyAIError(err);
      if (errType === 'RATE_LIMIT') aiKeyManager.markFailure(apiKey, true);
      throw err;
    }
  }
};
