/**
 * Grok Service (xAI)
 * Used as tertiary AI fallback: gemini-2.0-flash → gemini-1.5-flash-latest → Grok
 * Grok API is OpenAI-compatible, uses fetch with xAI endpoint.
 */

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-3-mini'; // Fast, cost-efficient model

export async function callGrok(prompt: string, timeoutMs: number = 15000): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not configured');

  console.log('[GROK] Calling grok-3-mini as tertiary fallback...');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Anda adalah Senior Research Assistant akademik. Selalu jawab dalam Bahasa Indonesia yang formal dan akademik. Gunakan format markdown yang rapi.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`GROK_HTTP_${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || text.trim().length === 0) throw new Error('GROK_EMPTY_RESPONSE');

    console.log(`[GROK] Success — ${text.length} chars`);
    return text;

  } finally {
    clearTimeout(timer);
  }
}
