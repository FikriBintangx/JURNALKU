import { AIError, AIErrorType } from './errors';

export function safeParseJSON(text: string): any {
  if (!text) return null;

  let cleaned = text.trim();

  // 1. Remove Markdown code blocks if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }

  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 3. Try to fix common issues like trailing commas
    try {
        const fixed = cleaned
            .replace(/,\s*([\]}])/g, '$1') // Trailing commas
            .replace(/([^{,]\s*)(\w+):/g, '$1"$2":') // Unquoted keys (simple)
            .trim();
        return JSON.parse(fixed);
    } catch {
        // 4. Last ditch effort: find the first { and last }
        try {
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const extracted = cleaned.substring(firstBrace, lastBrace + 1);
            return JSON.parse(extracted.replace(/,\s*([\]}])/g, '$1'));
          }
        } catch (innerE) {
          throw new AIError(
            AIErrorType.INVALID_JSON,
            "Failed to parse AI response into valid JSON",
            undefined,
            { text: text.slice(0, 500) }
          );
        }
    }
    
    throw new AIError(
      AIErrorType.INVALID_JSON,
      "Malformed JSON response from AI provider",
      undefined,
      { text: text.slice(0, 500) }
    );
  }
}
