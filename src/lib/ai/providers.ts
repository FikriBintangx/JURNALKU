import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { OpenAI } from 'openai';
import { aiKeyManager } from '@/services/AIKeyManager';
import { AIError, AIErrorType } from './errors';
import { healthSystem, ProviderStatus } from '../reliability/health';
import { aiHealth } from './health'; // For legacy model mapping support if needed, but we'll use a local one for now

export interface ProviderResult {
  text: string;
  provider: string;
  model: string;
  usage?: any;
}

export interface AIProvider {
  name: string;
  execute(prompt: string, model?: string): Promise<ProviderResult>;
}

const PROVIDER_TIMEOUT = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, provider: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`[${provider}] Request timeout after ${ms}ms`)), ms)
    )
  ]);
}

// 1. GEMINI PROVIDER
export class GeminiProvider implements AIProvider {
  name = 'gemini';
  
  private mapModel(requested?: string): string {
    if (requested === 'gemini-1.5-flash') return 'gemini-1.5-flash-latest';
    if (requested === 'gemini-1.5-pro') return 'gemini-1.5-pro-latest';
    if (requested?.startsWith('gemini-')) return requested;
    return 'gemini-2.0-flash';
  }

  private extractJson(text: string): string {
    try {
      // Try to find JSON block in markdown
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) return match[1].trim();
      
      // Try to find first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return text.substring(start, end + 1);
      }
      return text.trim();
    } catch {
      return text.trim();
    }
  }

  async execute(prompt: string, model?: string): Promise<ProviderResult> {
    const targetModel = this.mapModel(model);
    
    if (healthSystem.getStatus(this.name) === ProviderStatus.DOWN) {
      throw new AIError(AIErrorType.PROVIDER_ERROR, "Gemini provider is currently DOWN");
    }

    const key = aiKeyManager.getBestKey();
    if (!key) throw new AIError(AIErrorType.RATE_LIMIT, "No healthy Gemini keys available");

    try {
      const genAI = new GoogleGenerativeAI(key);
      const gModel = genAI.getGenerativeModel({ model: targetModel });
      
      const result = await withTimeout(gModel.generateContent(prompt), PROVIDER_TIMEOUT, this.name);
      const text = result.response.text();
      
      if (!text) throw new Error("Empty response from Gemini");
      
      aiKeyManager.markSuccess(key);
      healthSystem.reportSuccess(this.name);
      return { text, provider: this.name, model: targetModel };
    } catch (e: any) {
      const isRateLimit = e.message?.includes('429') || e.message?.includes('quota');
      aiKeyManager.markFailure(key, isRateLimit);
      healthSystem.reportFailure(this.name, e);
      throw new AIError(AIErrorType.PROVIDER_ERROR, e.message, this.name, e);
    }
  }
}

// 2. GROQ PROVIDER
export class GroqProvider implements AIProvider {
  name = 'groq';

  private mapModel(requested?: string): string {
    if (requested === 'mixtral-8x7b-32768') return 'llama-3.1-8b-instant';
    if (requested?.includes('llama') || requested?.includes('mixtral')) return requested;
    return 'llama-3.3-70b-versatile';
  }

  async execute(prompt: string, model?: string): Promise<ProviderResult> {
    const targetModel = this.mapModel(model);
    const key = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    
    if (!key || key === 'your_key_here' || key === 'your_openai_api_key_here') {
        healthSystem.reportFailure(this.name, new Error("API key missing"));
        throw new AIError(AIErrorType.PROVIDER_ERROR, "Groq API key not configured");
    }

    if (healthSystem.getStatus(this.name) === ProviderStatus.DOWN) {
      throw new AIError(AIErrorType.PROVIDER_ERROR, "Groq provider is currently DOWN");
    }

    try {
      const groq = new Groq({ apiKey: key });
      const result = await withTimeout(
        groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: targetModel,
        }),
        PROVIDER_TIMEOUT,
        this.name
      );

      const text = result.choices[0]?.message?.content;
      if (!text) throw new Error("Empty response from Groq");

      healthSystem.reportSuccess(this.name);
      return { text, provider: this.name, model: targetModel };
    } catch (e: any) {
      healthSystem.reportFailure(this.name, e);
      throw new AIError(AIErrorType.PROVIDER_ERROR, e.message, this.name, e);
    }
  }
}

// 3. OPENAI PROVIDER
export class OpenAIProvider implements AIProvider {
  name = 'openai';

  private mapModel(requested?: string): string {
    if (requested?.startsWith('gpt-')) return requested;
    return 'gpt-4o-mini';
  }

  async execute(prompt: string, model?: string): Promise<ProviderResult> {
    const targetModel = this.mapModel(model);
    const key = process.env.OPENAI_API_KEY;
    
    if (!key || key === 'your_key_here') {
        healthSystem.reportFailure(this.name, new Error("API key missing"));
        throw new AIError(AIErrorType.PROVIDER_ERROR, "OpenAI API key not configured");
    }

    if (healthSystem.getStatus(this.name) === ProviderStatus.DOWN) {
      throw new AIError(AIErrorType.PROVIDER_ERROR, "OpenAI provider is currently DOWN");
    }

    try {
      const openai = new OpenAI({ apiKey: key });
      const result = await withTimeout(
        openai.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: targetModel,
        }),
        PROVIDER_TIMEOUT,
        this.name
      );

      const text = result.choices[0]?.message?.content;
      if (!text) throw new Error("Empty response from OpenAI");

      healthSystem.reportSuccess(this.name);
      return { text, provider: this.name, model: targetModel };
    } catch (e: any) {
      healthSystem.reportFailure(this.name, e);
      throw new AIError(AIErrorType.PROVIDER_ERROR, e.message, this.name, e);
    }
  }
}
// 4. OPENROUTER PROVIDER
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';

  private mapModel(requested?: string): string {
    if (requested?.includes('/')) return requested;
    return 'google/gemini-2.0-flash-001';
  }

  async execute(prompt: string, model?: string): Promise<ProviderResult> {
    const targetModel = this.mapModel(model);
    
    // Check multiple keys
    let key = '';
    for (let i = 1; i <= 5; i++) {
      const k = process.env[`OPENROUTER_API_KEY_${i}`];
      if (k && k.trim()) {
        key = k;
        break;
      }
    }

    if (!key) throw new AIError(AIErrorType.PROVIDER_ERROR, "OpenRouter API key not configured");

    try {
      const response = await withTimeout(
        fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://jurnalstar.ai",
            "X-Title": "JurnalStar OS"
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: "user", content: prompt }]
          })
        }),
        PROVIDER_TIMEOUT,
        this.name
      );

      const data = await response.json();
      const text = data.choices[0]?.message?.content;
      
      if (!text) throw new Error(data.error?.message || "Empty response from OpenRouter");

      healthSystem.reportSuccess(this.name);
      return { text, provider: this.name, model: targetModel };
    } catch (e: any) {
      healthSystem.reportFailure(this.name, e);
      throw new AIError(AIErrorType.PROVIDER_ERROR, e.message, this.name, e);
    }
  }
}
