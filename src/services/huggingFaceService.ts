/**
 * HUGGINGFACE INFERENCE SERVICE (REBUILT)
 * 
 * Production-grade adapter for HF Inference API with dynamic model selection,
 * proper error mapping, and Indonesian localization.
 */

import { providerHealth } from "./arai/providerHealth";
import { modelRegistry } from "./arai/modelRegistry";

const HF_BASE = 'https://api-inference.huggingface.co/models';

// Active models that support Inference API as of 2024/2025
const RECOMMENDED_MODELS = [
  'mistralai/Mistral-7B-Instruct-v0.3',
  'meta-llama/Llama-3.1-8B-Instruct',
  'Qwen/Qwen2.5-7B-Instruct',
  'TinyLlama/TinyLlama-1.1B-Chat-v1.0'
];

let hfKeyIndex = 0;
function getHFKey(): string | null {
  const keys = [
    process.env.HUGGINGFACE_API_KEY_1,
    process.env.HUGGINGFACE_API_KEY_2,
    process.env.HUGGINGFACE_API_KEY_3,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) return null;
  return keys[hfKeyIndex++ % keys.length];
}

export async function callHuggingFace(prompt: string, timeoutMs: number = 30000): Promise<string> {
  if (!providerHealth.isHealthy('huggingface')) {
    throw new Error('HUGGINGFACE_CIRCUIT_TRIPPED');
  }

  const apiKey = getHFKey();
  if (!apiKey) throw new Error('HUGGINGFACE_NOT_CONFIGURED');

  // Format with generic chat template
  const formattedPrompt = `<|system|>\nAnda adalah Senior Research Assistant akademik. JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN PERNAH MENGGUNAKAN SIMBOL # ATAU *.<|end|>\n<|user|>\n${prompt}<|end|>\n<|assistant|>`;

  const modelsToTry = RECOMMENDED_MODELS;
  let lastError: Error | null = null;

  for (const modelId of modelsToTry) {
    const t0 = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[HUGGINGFACE] Inference: ${modelId}`);
      providerHealth.trackRequest('huggingface');

      const response = await fetch(`${HF_BASE}/${modelId}`, {
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
            return_full_text: false
          },
          options: { wait_for_model: true }
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          providerHealth.reportFailure('huggingface', 'rate_limit');
        } else if (status === 404) {
          providerHealth.reportFailure('huggingface', 'missing_model');
          modelRegistry.markModelFailure(modelId);
        } else {
          providerHealth.reportFailure('huggingface', 'server_error');
        }
        
        if (status === 503 || status === 404) continue; // Try next model
        throw new Error(`HF_ERROR_${status}`);
      }

      const data = await response.json();
      let text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
      
      if (!text) throw new Error('HF_EMPTY_RESPONSE');

      // Clean up symbols and template markers
      text = text.replace(/<\|[^|]*\|>/g, '').replace(/[#*]/g, '').trim();
      
      providerHealth.reportSuccess('huggingface', Date.now() - t0);
      modelRegistry.markModelSuccess(modelId);
      
      return text;

    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        providerHealth.reportFailure('huggingface', 'timeout');
      } else {
        providerHealth.reportFailure('huggingface', 'server_error');
      }
    }
  }

  throw lastError || new Error('HUGGINGFACE_ALL_MODELS_FAILED');
}
