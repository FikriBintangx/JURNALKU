import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager, classifyAIError } from "./AIKeyManager";
import { callGrok } from "./grokService";
import { callOpenRouter } from "./openRouterService";
import { callHuggingFace } from "./huggingFaceService";

// PRIMARY model — gemini-2.0-flash (latest stable)
// FALLBACK model — gemini-1.5-flash-latest (if primary fails with model error)
const PRIMARY_MODEL = "gemini-2.0-flash";
const FALLBACK_MODEL = "gemini-1.5-flash-latest";
const AI_TIMEOUT_MS = 15000; // 15 seconds as requested

const generationConfig: GenerationConfig = {
  temperature: 0.4,
  topP: 0.85,
  topK: 40,
  maxOutputTokens: 2048,
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
  model?: string; // Specific model selected by user
}

// Concurrency limiter
let activeRequests = 0;
const MAX_CONCURRENT = 3;
const queue: (() => void)[] = [];

const processQueue = () => {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift();
    if (next) { activeRequests++; next(); }
  }
};

// ─────────────────────────────────────────────────────────────
// FALLBACK CONTENT GENERATOR
// Called when AI is unavailable. Returns real, helpful content.
// ─────────────────────────────────────────────────────────────
function generateFallback(type: string, title: string, abstract: string): string {
  const t = (title || 'jurnal ini').slice(0, 120);
  const ab = (abstract || '').slice(0, 400);
  const abShort = ab ? `"${ab}${abstract && abstract.length > 400 ? '...' : ''}"` : '*(abstrak tidak tersedia)*';

  const map: Record<string, string> = {
    summary: `## Ringkasan (Fallback)

Layanan AI sementara tidak tersedia. Berikut abstrak asli jurnal untuk referensi Anda:

${abShort}

**Judul:** ${t}

*Coba generate ulang setelah beberapa menit untuk mendapatkan ringkasan AI yang lebih mendalam.*`,

    gap: `## Analisis Research Gap (Fallback)

Berdasarkan judul **"${t}"**, berikut potensi research gap yang umum ditemukan:

1. **Keterbatasan Sampel** — Cakupan geografis atau demografis yang terbatas.
2. **Variabel yang Belum Dieksplorasi** — Faktor moderasi atau mediasi yang belum diuji.
3. **Studi Longitudinal** — Kurangnya data jangka panjang untuk konfirmasi temuan.
4. **Konteks Berbeda** — Peluang replikasi di industri atau budaya lain.
5. **Aplikasi Praktis** — Celah antara temuan teoritis dan implementasi nyata.

*Analisis AI mendalam akan tersedia saat layanan kembali normal.*`,

    keywords: `## Kata Kunci yang Disarankan (Fallback)

Berdasarkan judul **"${t}"**:

• ${t.split(' ').slice(0, 4).join(' ')}
• Academic research
• Literature review
• Systematic analysis
• Empirical study
• ${new Date().getFullYear()} research

*Generate ulang untuk kata kunci AI yang lebih akurat dan bilingual.*`,

    citation: `## Format Sitasi (Fallback)

**APA 7th Edition:**
Penulis, A. A. (${new Date().getFullYear()}). ${t}. *Nama Jurnal*. https://doi.org/...

**MLA 9th:**
Penulis. "${t}." *Nama Jurnal*, ${new Date().getFullYear()}.

**IEEE:**
A. Penulis, "${t}," *Nama Jurnal*, ${new Date().getFullYear()}.

*Gunakan DOI yang tersedia pada halaman jurnal untuk sitasi yang akurat.*`,

    explainer: `## Penjelasan Sederhana (Fallback)

Jurnal **"${t}"** membahas topik penelitian akademik. ${ab ? `Secara singkat: ${ab.slice(0, 200)}` : ''}

Bayangkan penelitian ini seperti detektif yang mencari jawaban atas pertanyaan besar. Para peneliti mengumpulkan data, menganalisisnya, dan menyimpulkan hasilnya untuk membantu kita semua memahami dunia lebih baik.

*Penjelasan AI yang lebih interaktif akan tersedia saat layanan pulih.*`,

    ideas: `## Ide Penelitian Lanjutan (Fallback)

Berdasarkan topik **"${t}"**, beberapa ide penelitian yang dapat dikembangkan:

1. **Replikasi & Ekstensi** — Uji ulang dengan sampel lebih besar atau konteks berbeda.
2. **Pendekatan Mixed Method** — Kombinasikan kuantitatif dan kualitatif.
3. **Studi Komparatif** — Bandingkan antar negara, industri, atau periode waktu.
4. **Aplikasi Teknologi** — Integrasikan AI/ML untuk analisis yang lebih mendalam.
5. **Implikasi Kebijakan** — Terjemahkan temuan ke rekomendasi praktis.

*Generate ulang untuk ide yang lebih spesifik berdasarkan analisis AI.*`,

    roadmap: `## Roadmap Penelitian (Fallback)

**Fase 1: Fondasi (0-3 bulan)**
- Review literatur terkait "${t}"
- Identifikasi research gap
- Rancang metodologi penelitian

**Fase 2: Pengumpulan Data (3-6 bulan)**
- Desain instrumen penelitian
- Pengambilan sampel
- Pengumpulan dan validasi data

**Fase 3: Analisis & Penulisan (6-9 bulan)**
- Analisis statistik atau tematik
- Interpretasi hasil
- Penulisan draft paper

**Fase 4: Publikasi (9-12 bulan)**
- Revisi & peer review
- Submission ke jurnal target
- Diseminasi hasil

*Roadmap yang lebih detail dan personal tersedia saat layanan AI aktif.*`,
  };

  return map[type] || `## Hasil AI (Fallback)

Layanan AI sementara tidak tersedia untuk fitur **"${type}"**.

${ab ? `**Abstrak jurnal:**\n${abShort}` : ''}

*Silakan coba lagi dalam beberapa menit.*`;
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE
// ─────────────────────────────────────────────────────────────
export const geminiService = {
  async generateAI({ paperId, type, prompt, abstract, title, model }: AIRequest): Promise<any> {
    if (!paperId || !type) {
      return { success: false, message: "Missing required fields (paperId, type)." };
    }

    // Use model in cache key to separate results from different models
    const cacheKey = `ai:v3:${type}:${paperId}${model ? `:${model.split('/').pop()}` : ''}`;

    // 1. Cache check
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[AI SERVICE] Cache hit: ${cacheKey}`);
          return { success: true, data: cached, cached: true };
        }
      } catch (e) {
        console.warn("[AI SERVICE] Cache read failed (non-critical).");
      }
    }

    // 2. Queue & execute
    return new Promise((resolve) => {
      const execute = async () => {
        try {
          const result = await this.executeWithRetry({ paperId, type, prompt, abstract, title, model });

          if (result.success && !result.fallback && redis && result.data) {
            try {
              // Cache results for 7 days
              await redis.set(cacheKey, result.data, { ex: 60 * 60 * 24 * 7 });
            } catch {
              // Non-critical cache write failure
            }
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
        console.log(`[AI SERVICE] Queued (queue size: ${queue.length})`);
        queue.push(execute);
      }
    });
  },

  async tryGenerateContent(apiKey: string, modelName: string, fullPrompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig, safetySettings });

    const result = await Promise.race([
      model.generateContent({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
      ),
    ]) as any;

    const text = result?.response?.text?.();
    if (!text || text.trim().length === 0) throw new Error("EMPTY_RESPONSE");
    return text;
  },

  async executeWithRetry(req: AIRequest, attempt: number = 1): Promise<any> {
    const { abstract, title, prompt, type, model } = req;

    // If no content to analyze, return fallback immediately
    if (!abstract && !title) {
      console.warn(`[AI SERVICE] [FALLBACK] No content for type "${type}" — returning fallback.`);
      return {
        success: true,
        data: generateFallback(type || 'summary', title || '', abstract || ''),
        fallback: true,
      };
    }

    const fullPrompt = `Bertindaklah sebagai Senior Research Assistant profesional.

Judul Paper: ${title || 'Tidak diketahui'}
Abstrak: ${(abstract || '').slice(0, 4000)}

TUGAS:
${prompt}

INSTRUKSI PENTING:
- Jawab dalam Bahasa Indonesia yang formal dan akademik.
- Langsung ke inti pembahasan, tanpa intro panjang.
- Format jawaban dengan markdown yang rapi (gunakan ##, bold, bullet points).
- Jika data tidak lengkap, berikan analisis terbaik berdasarkan judul.`;

    // ── STRATEGY: IF SPECIFIC MODEL IS REQUESTED, JUMP STRAIGHT TO OPENROUTER ──
    if (model) {
      try {
        console.log(`[AI SERVICE] [USER REQUEST] Forcing model: ${model}`);
        const orText = await callOpenRouter(fullPrompt, 15000, model);
        if (orText) {
          console.log(`[AI SERVICE] [OPENROUTER] ✓ Success via user-selected model: ${model}`);
          return { success: true, data: orText, provider: 'openrouter', model };
        }
      } catch (orErr: any) {
        console.warn(`[AI SERVICE] [USER REQUEST] ✗ Forced model ${model} failed: ${orErr.message}`);
        // Fallback to default pipeline if forced model fails
      }
    }

    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) {
      console.warn(`[AI SERVICE] [FALLBACK] No keys available — returning fallback.`);
      return {
        success: true,
        data: generateFallback(type || 'summary', title || '', abstract || ''),
        fallback: true,
      };
    }

    try {
      console.log(`[AI SERVICE] Attempt ${attempt} — Model: ${PRIMARY_MODEL}, Project: ${aiKeyManager.maskKey(apiKey)}`);
      const text = await this.tryGenerateContent(apiKey, PRIMARY_MODEL, fullPrompt);
      aiKeyManager.markSuccess(apiKey);
      console.log(`[AI SERVICE] Success — type: ${type}, chars: ${text.length}`);
      return { success: true, data: text };

    } catch (primaryError: any) {
      const errType = classifyAIError(primaryError);
      console.warn(`[AI SERVICE] [${errType}] Attempt ${attempt} failed (${PRIMARY_MODEL}): ${primaryError.message}`);

      if (errType === 'RATE_LIMIT') {
        aiKeyManager.markFailure(apiKey, true);
      } else if (errType === 'NETWORK_ERROR') {
        aiKeyManager.markFailure(apiKey, false);
      }

      if (errType === 'MODEL_ERROR') {
        try {
          console.log(`[AI SERVICE] [MODEL ERROR] Trying fallback model: ${FALLBACK_MODEL}`);
          const text = await this.tryGenerateContent(apiKey, FALLBACK_MODEL, fullPrompt);
          aiKeyManager.markSuccess(apiKey);
          console.log(`[AI SERVICE] Fallback model succeeded — type: ${type}`);
          return { success: true, data: text };
        } catch (fallbackModelError: any) {
          console.error(`[AI SERVICE] Both models failed.`);
        }
      }

      if (attempt < 3) {
        const delay = errType === 'RATE_LIMIT' ? 1500 : 700;
        await new Promise(r => setTimeout(r, delay));
        return this.executeWithRetry(req, attempt + 1);
      }

      // ── Tier 3: Grok (xAI) ──────────────────────────────────
      try {
        console.log('[AI SERVICE] [GROK] Trying Grok (tier 3)...');
        const grokText = await callGrok(fullPrompt, 15000);
        if (grokText) return { success: true, data: grokText, provider: 'grok' };
      } catch {}

      // ── Tier 4: OpenRouter ──────────────────────────────────
      try {
        console.log('[AI SERVICE] [OPENROUTER] Trying OpenRouter (tier 4)...');
        const orText = await callOpenRouter(fullPrompt, 15000);
        if (orText) return { success: true, data: orText, provider: 'openrouter' };
      } catch {}

      // ── Tier 5: HuggingFace ─────────────────────────────────
      try {
        console.log('[AI SERVICE] [HUGGINGFACE] Trying HuggingFace (tier 5)...');
        const hfText = await callHuggingFace(fullPrompt, 20000);
        if (hfText) return { success: true, data: hfText, provider: 'huggingface' };
      } catch {}

      // ── All 5 AI tiers exhausted ────────────────────────────
      return {
        success: true,
        data: generateFallback(type || 'summary', title || '', abstract || ''),
        fallback: true,
      };
    }
  },
};
