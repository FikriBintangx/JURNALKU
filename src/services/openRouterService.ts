/**
 * OpenRouter Service - Resilient Implementation
 * 
 * OpenRouter routes to 100+ models. We use it as a high-tier fallback.
 * Includes dynamic model validation and health tracking.
 */

import { providerHealth } from "./arai/providerHealth";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  quality: string;
}

// Updated with currently active/popular OpenRouter endpoints
export const AI_MODELS: AIModel[] = [
  { id: 'isagi-autonomous', name: 'ISAGI Autonomous', provider: 'AGI Kernel', quality: 'Elite' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'OpenRouter', quality: 'Fast' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', provider: 'OpenRouter', quality: 'High' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'OpenRouter', quality: 'Elite' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'OpenRouter', quality: 'Elite' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'OpenRouter', quality: 'High' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', provider: 'OpenRouter', quality: 'Standard' },
];

import { modelRegistry } from './arai/modelRegistry';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Stable fallback models (prioritizing high-availability free/low-cost)
const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-7b-instruct:free'
];

let keyIndex = 0;
function getNextKey(): string | null {
  const keys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) return null;
  return keys[keyIndex++ % keys.length];
}

export async function callOpenRouter(prompt: string, timeoutMs: number = 20000, modelOverride?: string): Promise<string> {
  const apiKey = getNextKey();
  if (!apiKey) throw new Error('OPENROUTER_NOT_CONFIGURED');

  const model = modelOverride || 'google/gemini-2.0-flash-001';
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jurnalstar.id',
        'X-Title': 'ISAGI Research Engine',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Anda adalah Senior Research Assistant akademik. JAWAB DALAM BAHASA INDONESIA FORMAL. PENTING: JANGAN PERNAH MENGGUNAKAN SIMBOL MARKDOWN SEPERTI # ATAU * DALAM JAWABAN ANDA. Gunakan baris baru dan spasi untuk struktur, bukan simbol.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const status = response.status;
      if (status === 404) {
        modelRegistry.markModelFailure(model);
        providerHealth.reportFailure('openrouter', 'missing_model');
      } else if (status === 429) {
        providerHealth.reportFailure('openrouter', 'rate_limit');
      } else {
        providerHealth.reportFailure('openrouter', `server_error_${status}`);
      }
      throw new Error(`OPENROUTER_ERROR_${status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) throw new Error('OPENROUTER_EMPTY_RESPONSE');

    providerHealth.reportSuccess('openrouter', Date.now() - t0);
    modelRegistry.markModelSuccess(model);
    
    return text.replace(/[#*]/g, '');

  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      providerHealth.reportFailure('openrouter', 'timeout');
    } else {
      providerHealth.reportFailure('openrouter', err);
    }
    throw err;
  }
}
