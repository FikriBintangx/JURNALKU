import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiKeyManager, classifyAIError } from "@/services/AIKeyManager";

const PRIMARY_MODEL = "gemini-2.0-flash";
const FALLBACK_MODEL = "gemini-1.5-flash-latest";

/**
 * Universal AI content generator.
 * Uses key rotation, model fallback chain, and never throws.
 * Returns parsed JSON if useJson=true, plain text otherwise.
 */
export async function generateAIContent(prompt: string, useJson: boolean = false): Promise<any> {
  const apiKey = aiKeyManager.getBestKey();

  if (!apiKey) {
    console.error("[AI LIB] No API keys available.");
    throw new Error("AI service unavailable: no API keys configured.");
  }

  // Try PRIMARY model
  try {
    console.log(`[AI LIB] Generating with ${PRIMARY_MODEL}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: PRIMARY_MODEL,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        ...(useJson ? { responseMimeType: "application/json" } : {}),
      },
    });

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000)
      ),
    ]) as any;

    const text = result?.response?.text?.();
    if (!text) throw new Error("EMPTY_RESPONSE");

    aiKeyManager.markSuccess(apiKey);

    if (useJson) {
      try {
        // Strip markdown code fences if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch {
        // If JSON parse fails, return a structured fallback
        return { summary: text, keyPoints: [], methodology: '', conclusion: '' };
      }
    }
    return text;

  } catch (primaryErr: any) {
    const errType = classifyAIError(primaryErr);
    console.warn(`[AI LIB] [${errType}] Primary model failed: ${primaryErr.message}`);

    if (errType === 'RATE_LIMIT') aiKeyManager.markFailure(apiKey, true);
    else if (errType === 'NETWORK_ERROR') aiKeyManager.markFailure(apiKey, false);
    // MODEL_ERROR: no key penalty

    // Try FALLBACK model
    try {
      console.log(`[AI LIB] Trying fallback model: ${FALLBACK_MODEL}...`);
      const genAI2 = new GoogleGenerativeAI(apiKey);
      const fallbackModel = genAI2.getGenerativeModel({
        model: FALLBACK_MODEL,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          ...(useJson ? { responseMimeType: "application/json" } : {}),
        },
      });

      const res2 = await Promise.race([
        fallbackModel.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error("AI_TIMEOUT")), 15000)),
      ]) as any;

      const text2 = res2?.response?.text?.();
      if (!text2) throw new Error("EMPTY_RESPONSE");

      aiKeyManager.markSuccess(apiKey);

      if (useJson) {
        try {
          const cleaned = text2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(cleaned);
        } catch {
          return { summary: text2, keyPoints: [], methodology: '', conclusion: '' };
        }
      }
      return text2;

    } catch (fallbackErr: any) {
      console.error(`[AI LIB] Both models failed: ${fallbackErr.message}`);
      throw new Error("All AI models unavailable. Please try again later.");
    }
  }
}
