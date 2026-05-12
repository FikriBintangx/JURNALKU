/**
 * Groq Service - Resilient Implementation
 */

import { providerHealth } from "./arai/providerHealth";

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Fast)', provider: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
];

export async function callGroq(prompt: string, modelOverride?: string, timeoutMs: number = 20000): Promise<string> {
  if (!providerHealth.isHealthy('groq')) {
    throw new Error('GROQ_CIRCUIT_TRIPPED');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY_MISSING');

  const model = modelOverride || 'llama-3.3-70b-versatile';
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    providerHealth.trackRequest('groq');
    const response = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Anda adalah Senior Research Assistant akademik. Jawab dalam Bahasa Indonesia formal.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        providerHealth.reportFailure('groq', 'quota_exceeded');
      } else {
        providerHealth.reportFailure('groq', `server_error_${response.status}`);
      }
      throw new Error(`GROQ_ERROR_${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('GROQ_EMPTY_RESPONSE');

    providerHealth.reportSuccess('groq', Date.now() - t0);
    return text;

  } catch (err: any) {
    providerHealth.reportFailure('groq', false);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
