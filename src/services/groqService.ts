/**
 * Groq Service
 * 
 * Groq is the speed king of AI inference. 
 * We use it as a high-speed fallback and a primary option in the model selector.
 * 
 * API: https://api.groq.com/openai/v1/chat/completions
 */

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Fast)', provider: 'Groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)', provider: 'Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Groq' },
];

export async function callGroq(prompt: string, modelOverride?: string, timeoutMs: number = 15000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY_MISSING');

  const model = modelOverride || 'llama-3.3-70b-versatile';
  console.log(`[GROQ] Calling ${model}...`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Anda adalah Senior Research Assistant akademik Indonesia. Jawab dalam Bahasa Indonesia formal dengan markdown terstruktur.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`GROQ_ERROR_${response.status}: ${err.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) throw new Error('GROQ_EMPTY_RESPONSE');

    console.log(`[GROQ] Success via ${model}`);
    return text;

  } finally {
    clearTimeout(timer);
  }
}
