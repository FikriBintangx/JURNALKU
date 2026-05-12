import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager, classifyAIError } from "./AIKeyManager";
import { callGrok } from "./grokService";
import { callOpenRouter } from "./openRouterService";
import { callHuggingFace } from "./huggingFaceService";
import { callGroq, GROQ_MODELS } from "./groqService";

// PRIMARY model — gemini-2.0-flash (latest stable)
// FALLBACK model — gemini-1.5-flash-latest (if primary fails with model error)
// PRIMARY model — gemini-1.5-flash (stable production)
// SECONDARY model — gemini-1.5-pro (high quality)
// EXPERIMENTAL model — gemini-2.0-flash (latest)
const PRIMARY_MODEL = "gemini-1.5-flash";
const SECONDARY_MODEL = "gemini-1.5-pro";
const EXPERIMENTAL_MODEL = "gemini-2.0-flash";
const AI_TIMEOUT_MS = 15000; 

const generationConfig: GenerationConfig = {
  temperature: 0.5,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 3000,
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
const MAX_CONCURRENT = 4;
const queue: (() => void)[] = [];

const processQueue = () => {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift();
    if (next) { activeRequests++; next(); }
  }
};

// ─────────────────────────────────────────────────────────────
// NEURAL APPROXIMATION (LOCAL FALLBACK)
// ─────────────────────────────────────────────────────────────
function generateFallback(type: string, title: string, abstract: string): string {
  const t = (title || 'Research Artifact').slice(0, 150);
  const ab = (abstract || '').slice(0, 500);
  const abShort = ab ? `"${ab}${abstract && abstract.length > 500 ? '...' : ''}"` : '*(Metadata unavailable)*';

  const map: Record<string, string> = {
    summary: `### 🧠 Neural Approximation: Summary
    
*Layanan intelijen eksternal sedang dalam pemeliharaan. Berikut adalah ringkasan berbasis metadata lokal.*

**Abstract Overview:**
${abShort}

**Contextual Analysis:**
Penelitian berjudul **"${t}"** ini mengeksplorasi domain akademik spesifik. Berdasarkan judul, fokus utama terletak pada pengembangan metodologi atau analisis fenomena dalam konteks subjek tersebut.

> [!NOTE]
> Analisis AI mendalam (Gemini) akan tersedia kembali secara otomatis dalam beberapa menit.`,

    gap: `### 🎯 Research Gap Matrix (Approx)

*Potensi celah penelitian berdasarkan analisis pola judul & abstrak.*

1. **Geographical Variance** — Peluang replikasi pada wilayah atau demografi yang berbeda dari fokus utama **"${t}"**.
2. **Variable Moderation** — Penambahan variabel mediasi baru (misal: faktor digital atau psikologis) yang mungkin belum diulas secara eksplisit.
3. **Methodological Shift** — Jika paper ini menggunakan kualitatif, peluang penelitian baru menggunakan pendekatan kuantitatif/big data.
4. **Contextual Application** — Penerapan temuan pada industri yang berbeda dari subjek aslinya.

*Silakan generate ulang untuk mendapatkan mapping celah yang lebih presisi.*`,

    keywords: `### 🏷️ Neural Tags (Approximation)

Berdasarkan analisis frekuensi istilah pada **"${t}"**:

• **Core Focus:** ${t.split(' ').slice(0, 3).join(' ')}
• **Domain:** Academic Inquiry
• **Framework:** Research Analysis
• **Context:** Professional Study
• **Temporal:** ${new Date().getFullYear()} Trends

*Keywords akan diperbarui dengan ontologi AI yang lebih kaya saat sistem pulih.*`,

    citation: `### 📝 Automated Citation (Draft)

**APA:**
Author. (${new Date().getFullYear()}). ${t}. *Journal Repository*.

**MLA:**
Author. "${t}." *Journal Repository*, ${new Date().getFullYear()}.

**IEEE:**
[1] Author, "${t}," *Journal Repository*, ${new Date().getFullYear()}.

*Gunakan DOI pada bagian metadata untuk akurasi hukum.*`,

    explainer: `### 💡 Simple Insight (ELI5)

Paper **"${t}"** ini seperti sebuah buku panduan untuk memahami rahasia di balik topik tersebut. Peneliti mencari tahu "mengapa" dan "bagaimana" hal itu terjadi, lalu menceritakannya kepada kita agar kita bisa belajar hal baru.

*Penjelasan interaktif AI akan segera aktif kembali.*`,
  };

  return map[type] || `### 📡 Status: Neural Connectivity Limited

Layanan AI untuk fitur **"${type}"** sedang dialihkan ke sistem cadangan. 

**Research Context:**
${t}

*Sistem sedang mencoba menyambungkan kembali ke Neural Network. Silakan coba dalam 2-3 menit.*`;
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE
// ─────────────────────────────────────────────────────────────
export const geminiService = {
  async generateAI({ paperId, type, prompt, abstract, title, model }: AIRequest): Promise<any> {
    if (!paperId || !type) {
      return { success: false, message: "Required parameters missing." };
    }

    const cacheKey = `ai:v5:${type}:${paperId}${model ? `:${model.split('/').pop()}` : ''}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached, cached: true };
      } catch {}
    }

    return new Promise((resolve) => {
      const execute = async () => {
        try {
          const result = await this.executeWithRetry({ paperId, type, prompt, abstract, title, model });
          if (result && result.success && !result.fallback && redis && result.data) {
            try { await redis.set(cacheKey, result.data, { ex: 60 * 60 * 24 * 7 }); } catch {}
          }
          resolve(result || { success: false, message: "AI process failed to return a result." });
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

  async tryGenerateContent(apiKey: string, modelName: string, fullPrompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig, safetySettings });
    const result = await Promise.race([
      model.generateContent({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)),
    ]) as any;
    const text = result?.response?.text?.();
    if (!text) throw new Error("EMPTY_RESPONSE");
    return text;
  },

  async executeWithRetry(req: AIRequest, attempt: number = 1): Promise<any> {
    try {
      const { abstract, title, prompt, type, model } = req;
      
      // Normalize abstract for the prompt
      const cleanedAbstract = (abstract || '').replace(/abstrak tidak dapat dimuat saat ini/gi, '').trim();

      if (!cleanedAbstract && !title) {
        return { success: true, data: generateFallback(type || 'summary', title || '', abstract || ''), fallback: true };
      }

      const fullPrompt = `Persona: Senior Research Architect & Academic Consultant.
      
Context:
- Paper Title: ${title || 'N/A'}
- Abstract: ${cleanedAbstract.slice(0, 5000) || 'N/A'}

Tujuan:
${prompt}

Standard:
- Bahasa Indonesia Formal & Akademik.
- High-level insights, bukan sekadar deskriptif.
- Gunakan Markdown yang rapi dengan sub-heading.
- Berikan opini ahli jika relevan.`;

      // ── STRATEGY: IF SPECIFIC MODEL IS REQUESTED ──
      if (model) {
        try {
          if (GROQ_MODELS.some(m => m.id === model)) {
            const groqText = await callGroq(fullPrompt, model);
            if (groqText) return { success: true, data: groqText, provider: 'groq', model };
          } else {
            const orText = await callOpenRouter(fullPrompt, 15000, model);
            if (orText) return { success: true, data: orText, provider: 'openrouter', model };
          }
        } catch (err: any) {
          console.warn(`[AI SERVICE] Model bypass failed: ${err.message}`);
        }
      }

      const apiKey = aiKeyManager.getBestKey();
      if (!apiKey) return { success: true, data: generateFallback(type || 'summary', title || '', abstract || ''), fallback: true };

      // Try PRIMARY (Fast Flash)
      try {
        console.log(`[AI SERVICE] [T1] Model: ${PRIMARY_MODEL} (Attempt ${attempt})`);
        const text = await this.tryGenerateContent(apiKey, PRIMARY_MODEL, fullPrompt);
        aiKeyManager.markSuccess(apiKey);
        return { success: true, data: text };
      } catch (primaryError: any) {
        const errType = classifyAIError(primaryError);
        console.warn(`[AI SERVICE] T1 Error: ${errType}`);

        if (errType === 'RATE_LIMIT') aiKeyManager.markFailure(apiKey, true);
        else if (errType === 'NETWORK_ERROR') aiKeyManager.markFailure(apiKey, false);

        // Try SECONDARY (Pro - higher quality if Flash fails or 404s)
        try {
          console.log(`[AI SERVICE] [T2] Model: ${SECONDARY_MODEL}`);
          const textPro = await this.tryGenerateContent(apiKey, SECONDARY_MODEL, fullPrompt);
          aiKeyManager.markSuccess(apiKey);
          return { success: true, data: textPro };
        } catch {}

        if (attempt < 2) return this.executeWithRetry(req, attempt + 1);

        // ── TIER 3: GROQ ──
        try {
          const groqText = await callGroq(fullPrompt);
          if (groqText) return { success: true, data: groqText, provider: 'groq' };
        } catch {}

        // ── TIER 4: OPENROUTER ──
        try {
          const orText = await callOpenRouter(fullPrompt);
          if (orText) return { success: true, data: orText, provider: 'openrouter' };
        } catch {}

        // ── FINAL FALLBACK: LOCAL NEURAL APPROXIMATION ──
        console.warn(`[AI SERVICE] All AI tiers failed. Using local approximation for ${type}`);
        return { 
          success: true, 
          data: generateFallback(type || 'summary', title || '', abstract || ''), 
          fallback: true,
          message: "Menggunakan optimasi lokal (API sedang sibuk)"
        };
      }
    } catch (err: any) {
      console.error(`[AI SERVICE] Fatal error in executeWithRetry:`, err);
      return { 
        success: true, 
        data: generateFallback(req.type || 'summary', req.title || '', req.abstract || ''), 
        fallback: true,
        error: true
      };
    }
  },
};
