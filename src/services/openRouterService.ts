/**
 * OpenRouter Service
 * 
 * OpenRouter is OpenAI-compatible and routes to 100+ models.
 * We use it as the 4th tier AI fallback with key rotation across 3 keys.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Models with labels for the UI
export const AI_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', provider: 'Mistral' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', provider: 'Google' },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', provider: 'Alibaba' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', provider: 'Microsoft' },
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

  // If a specific model is requested, try it first. Otherwise use fallbacks.
  const modelsToTry = modelOverride 
    ? [modelOverride, ...AI_MODELS.map(m => m.id).filter(id => id !== modelOverride)]
    : AI_MODELS.map(m => m.id);

  let lastError: Error | null = null;

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
        if (response.status === 429 || response.status === 402) {
          console.warn(`[OPENROUTER] Key/Model rate limited, trying next...`);
          continue; // Try next model
        }
        throw new Error(`OPENROUTER_${response.status}: ${errBody.slice(0, 100)}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text || text.trim().length === 0) {
        throw new Error('OPENROUTER_EMPTY_RESPONSE');
      }

      console.log(`[OPENROUTER] Success via ${model}`);
      return text;

    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[OPENROUTER] Model ${model} failed: ${err.message}`);

      if (err.name === 'AbortError') {
        // On timeout, we might want to try next model or just fail
        continue;
      }
    }
  }

  throw lastError || new Error('OPENROUTER_ALL_MODELS_FAILED');
}
