/**
 * HuggingFace Inference API Service
 * 
 * Used as 5th tier AI fallback (after Gemini → Grok → OpenRouter).
 * Uses the Inference API with 2-key rotation.
 * 
 * Best models for Indonesian academic text generation:
 * - microsoft/Phi-3.5-mini-instruct (fast, good quality)
 * - mistralai/Mistral-7B-Instruct-v0.3 (reliable, good for academic)
 * - HuggingFaceH4/zephyr-7b-beta (good instruction following)
 */

const HF_BASE = 'https://api-inference.huggingface.co/models';

const MODELS = [
  'microsoft/Phi-3.5-mini-instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'HuggingFaceH4/zephyr-7b-beta',
];

let hfKeyIndex = 0;
function getHFKey(): string | null {
  const keys = [
    process.env.HUGGINGFACE_API_KEY_1,
    process.env.HUGGINGFACE_API_KEY_2,
  ].filter(Boolean) as string[];

  if (keys.length === 0) return null;
  const key = keys[hfKeyIndex % keys.length];
  hfKeyIndex++;
  return key;
}

/**
 * Formats a chat-style prompt for HF text-generation models.
 * HF models use different prompt formats depending on the model.
 * We use a simple instruct format that works across models.
 */
function formatPrompt(systemPrompt: string, userPrompt: string): string {
  return `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${userPrompt}<|end|>\n<|assistant|>`;
}

export async function callHuggingFace(prompt: string, timeoutMs: number = 20000): Promise<string> {
  const apiKey = getHFKey();
  if (!apiKey) throw new Error('HUGGINGFACE_NOT_CONFIGURED');

  const systemPrompt = 'Anda adalah Senior Research Assistant akademik. Jawab dalam Bahasa Indonesia yang formal dan akademik. Gunakan format markdown yang rapi.';
  const formattedPrompt = formatPrompt(systemPrompt, prompt);

  let lastError: Error | null = null;

  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[HUGGINGFACE] Trying model: ${model}`);

      const response = await fetch(`${HF_BASE}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.4,
            do_sample: true,
            return_full_text: false,
          },
          options: {
            wait_for_model: true, // Wait if model is loading (cold start)
            use_cache: false,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        // Model loading — skip to next
        if (response.status === 503) {
          console.warn(`[HUGGINGFACE] Model ${model} loading — trying next.`);
          continue;
        }
        throw new Error(`HF_${response.status}: ${errBody.slice(0, 100)}`);
      }

      const data = await response.json();

      // HF Inference API returns array for text-generation
      let text = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        text = data[0].generated_text;
      } else if (typeof data === 'string') {
        text = data;
      } else if (data?.generated_text) {
        text = data.generated_text;
      }

      // Clean up any residual prompt artifacts
      text = text
        .replace(/<\|[^|]*\|>/g, '')
        .replace(/^\s*assistant\s*:?\s*/i, '')
        .trim();

      if (!text || text.length < 20) {
        throw new Error('HF_RESPONSE_TOO_SHORT');
      }

      console.log(`[HUGGINGFACE] Success via ${model} — ${text.length} chars`);
      return text;

    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(`[HUGGINGFACE] Model ${model} failed: ${err.message}`);

      if (err.name === 'AbortError') {
        throw new Error('HUGGINGFACE_TIMEOUT');
      }
      // Continue to next model
    }
  }

  throw lastError || new Error('HUGGINGFACE_ALL_MODELS_FAILED');
}
