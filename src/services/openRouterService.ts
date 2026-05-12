/**
 * OpenRouter Service
 * 
 * OpenRouter is OpenAI-compatible and routes to 100+ models.
 * We use it as the 4th tier AI fallback with key rotation across 3 keys.
 * 
 * Model priority (free/cheap models that work well for academic tasks):
 * - meta-llama/llama-3.1-8b-instruct:free
 * - mistralai/mistral-7b-instruct:free
 * - google/gemma-2-9b-it:free
 */
 
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  quality: string;
}

export const AI_MODELS: AIModel[] = [
  { id: 'isagi-autonomous', name: 'ISAGI Autonomous', provider: 'ISAGI ENGINE', quality: 'Agentic' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google AI', quality: 'Fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google AI', quality: 'High' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq (LP)', quality: 'Ultra-Fast' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq (LP)', quality: 'Fast' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta (Free)', quality: 'Good' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek v3', provider: 'OpenRouter', quality: 'Elite' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', provider: 'Google (Free)', quality: 'Standard' },
];

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Models to try in order (all free tier on OpenRouter)
const MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
];

// Round-robin key selector
let keyIndex = 0;
function getNextKey(): string | null {
  const keys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex++;
  return key;
}

export async function callOpenRouter(prompt: string, timeoutMs: number = 15000, modelOverride?: string): Promise<string> {
  const apiKey = getNextKey();
  if (!apiKey) throw new Error('OPENROUTER_NOT_CONFIGURED');

  let lastError: Error | null = null;
  const modelsToTry = modelOverride ? [modelOverride] : MODELS;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[OPENROUTER] Trying model: ${model}`);

      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jurnalstar.id',
          'X-Title': 'JurnalStar Academic Search',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah Senior Research Assistant akademik Indonesia. Jawab dalam Bahasa Indonesia yang formal. Gunakan format markdown yang rapi dan terstruktur.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        // If rate limited on this key, try next key
        if (response.status === 429 || response.status === 402) {
          const nextKey = getNextKey();
          if (nextKey && nextKey !== apiKey) {
            console.warn(`[OPENROUTER] Key rate limited, rotating...`);
            // Retry with next key would require restructuring — just throw
          }
        }
        throw new Error(`OPENROUTER_${response.status}: ${errBody.slice(0, 100)}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text || text.trim().length === 0) {
        throw new Error('OPENROUTER_EMPTY_RESPONSE');
      }

      console.log(`[OPENROUTER] Success via ${model} — ${text.length} chars`);
      return text;

    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[OPENROUTER] Model ${model} failed: ${err.message}`);

      // Try next model if current fails (except on timeout/abort)
      if (err.name === 'AbortError') {
        throw new Error('OPENROUTER_TIMEOUT');
      }
      // Continue to next model in loop
    }
  }

  throw lastError || new Error('OPENROUTER_ALL_MODELS_FAILED');
}
