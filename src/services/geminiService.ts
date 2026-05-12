import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { redis } from "@/lib/redis";
import { aiKeyManager, classifyAIError } from "./AIKeyManager";
import { callGrok } from "./grokService";
import { callOpenRouter } from "./openRouterService";
import { callHuggingFace } from "./huggingFaceService";
import { callGroq, GROQ_MODELS } from "./groqService";
import { ISAGIOrchestrator } from "./arai/orchestrator";

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
  model?: string;
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

    const cacheKey = `ai:v2:${type}:${paperId}${model ? `:${model.split('/').pop()}` : ''}`;

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
    const { abstract, title, prompt, type, model, paperId } = req;

    // If no content to analyze, return fallback immediately
    if (!abstract && !title) {
      console.warn(`[AI SERVICE] [FALLBACK] No content for type "${type}" — returning fallback.`);
      return {
        success: true,
        data: generateFallback(type || 'summary', title || '', abstract || ''),
        fallback: true,
      };
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

    // ── STRATEGY: IF SPECIFIC MODEL IS REQUESTED ──
    if (model) {
      try {
        if (model === 'isagi-autonomous') {
          console.log(`[AI SERVICE] [ISAGI] Triggering Autonomous Intelligence Engine for: ${type}`);
          // Reconstruct the best query for ISAGI
          const isagiQuery = type === 'summary' ? `Summarize: ${title}` : (prompt.length < 100 ? prompt : `${type} analysis of ${title}`);
          const araiRes = await ISAGIOrchestrator.run(isagiQuery, `session_${paperId}`, {
            limit: 10,
            forceRetrieval: true // Force fresh check for autonomous research
          });
          
          return { 
            success: true, 
            data: araiRes.answer, 
            provider: 'isagi-engine', 
            model: 'isagi-autonomous',
            intelligence: araiRes // Pass full trace back
          };
        }

        if (model.includes('gemini')) {
          const text = await this.tryGenerateContent(aiKeyManager.getBestKey() || '', model, fullPrompt);
          return { success: true, data: text, provider: 'gemini', model };
        } else if (GROQ_MODELS.some((m: any) => m.id === model)) {
          const groqText = await callGroq(fullPrompt, model);
          if (groqText) return { success: true, data: groqText, provider: 'groq', model };
        } else if (model.includes('/') || model.includes(':')) {
          const orText = await callOpenRouter(fullPrompt, 15000, model);
          if (orText) return { success: true, data: orText, provider: 'openrouter', model };
        }
      } catch (err: any) {
        console.warn(`[AI SERVICE] Model override failed (${model}): ${err.message}`);
        // Fall through to normal retry logic
      }
    }

    let lastErrorMsg = "Unknown error";

    try {
      console.log(`[AI SERVICE] Attempt ${attempt} — Model: ${PRIMARY_MODEL}, Project: ${aiKeyManager.maskKey(apiKey)}`);
      const text = await this.tryGenerateContent(apiKey, PRIMARY_MODEL, fullPrompt);
      aiKeyManager.markSuccess(apiKey);
      console.log(`[AI SERVICE] Success — type: ${type}, chars: ${text.length}`);
      return { success: true, data: text };

    } catch (primaryError: any) {
      lastErrorMsg = primaryError.message;
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
          lastErrorMsg = `Primary (${PRIMARY_MODEL}) and Fallback (${FALLBACK_MODEL}) both failed: ${fallbackModelError.message}`;
        }
      }

      if (attempt < 3) {
        const delay = errType === 'RATE_LIMIT' ? 1500 : 700;
        await new Promise(r => setTimeout(r, delay));
        return this.executeWithRetry(req, attempt + 1);
      }

      try {
        console.log('[AI SERVICE] [GROK] Trying Grok (tier 3)...');
        const grokText = await callGrok(fullPrompt, 15000);
        if (grokText && grokText.trim().length > 0) {
          return { success: true, data: grokText, provider: 'grok' };
        }
      } catch (grokErr: any) {
        lastErrorMsg = `Grok failed: ${grokErr.message}`;
      }

      try {
        console.log('[AI SERVICE] [OPENROUTER] Trying OpenRouter (tier 4)...');
        const orText = await callOpenRouter(fullPrompt, 15000);
        if (orText && orText.trim().length > 0) {
          return { success: true, data: orText, provider: 'openrouter' };
        }
      } catch (orErr: any) {
        lastErrorMsg = `OpenRouter failed: ${orErr.message}`;
      }

      try {
        console.log('[AI SERVICE] [HUGGINGFACE] Trying HuggingFace (tier 5)...');
        const hfText = await callHuggingFace(fullPrompt, 20000);
        if (hfText && hfText.trim().length > 0) {
          return { success: true, data: hfText, provider: 'huggingface' };
        }
      } catch (hfErr: any) {
        lastErrorMsg = `HuggingFace failed: ${hfErr.message}`;
      }

      console.error(`[AI SERVICE] [FALLBACK] All 5 AI providers exhausted — returning static fallback.`);
      return {
        success: true,
        data: generateFallback(type || 'summary', title || '', abstract || ''),
        fallback: true,
      };
    }
  },
};
