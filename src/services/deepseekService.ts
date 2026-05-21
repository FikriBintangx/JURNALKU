import { OpenAI } from 'openai';

// DeepSeek provides a fully OpenAI-compatible API
const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_key',
});

export const deepseekService = {
  /**
   * Generates a synthesized research summary or insight using DeepSeek models.
   * Very cost-effective for large academic contexts.
   */
  async generateInsight(prompt: string, model: 'deepseek-chat' | 'deepseek-reasoner' = 'deepseek-chat', maxTokens = 800) {
     if (!process.env.DEEPSEEK_API_KEY) {
         console.warn("[DeepSeek] API Key is missing. Returning fallback response.");
         return null;
     }
     
     try {
         const completion = await deepseek.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            max_tokens: maxTokens,
            temperature: 0.3, // Lower temp for factual academic responses
         });
         
         return completion.choices[0].message.content;
     } catch(error: any) {
         console.error("[DeepSeek] Synthesis Error:", error?.response?.data || error.message);
         return null;
     }
  }
};
