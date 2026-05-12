/**
 * OpenRouter Service - Unified Implementation
 * 
 * Handles all inference requests routed through OpenRouter.ai.
 * Standardized for the ISAGI orchestration layer.
 */

import { providerHealth } from "./arai/providerHealth";
import { executeProviderSafely, SafeInferenceResult } from "./arai/providerUtils";

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

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

/**
 * CALL OPENROUTER
 * Primary entry point for OpenRouter models.
 */
export async function callOpenRouter(prompt: string, timeoutMs: number = 20000, model: string = 'google/gemini-2.0-flash-001'): Promise<string> {
  const res = await executeOpenRouterInternal(prompt, model, timeoutMs);
  if (res.success) return res.data;
  throw new Error(res.message || 'OPENROUTER_FAILURE');
}

export async function executeOpenRouterInternal(prompt: string, model: string, timeoutMs: number = 20000): Promise<SafeInferenceResult> {
  const apiKey = getNextKey();
  if (!apiKey) {
    return {
      success: false,
      data: '',
      provider: 'openrouter',
      model,
      message: 'OPENROUTER_NOT_CONFIGURED'
    };
  }

  return executeProviderSafely('openrouter', model, async () => {
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
            { 
              role: 'system', 
              content: 'Anda adalah Senior Research Assistant akademik. JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN PERNAH MENGGUNAKAN SIMBOL MARKDOWN SEPERTI # ATAU * DALAM JAWABAN ANDA.' 
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`OPENROUTER_HTTP_${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;

      if (!text) throw new Error('OPENROUTER_EMPTY_RESPONSE');

      providerHealth.reportSuccess('openrouter', Date.now() - t0);
      return text.replace(/[#*]/g, '');

    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  });
}
