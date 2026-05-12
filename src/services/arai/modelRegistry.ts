/**
 * ISAGI DYNAMIC MODEL REGISTRY
 * 
 * Manages active AI models across providers, validates their availability,
 * and tracks endpoint health dynamically.
 */

import { ProviderType, providerHealth } from "./providerHealth";

export interface RegisteredModel {
  id: string;
  provider: ProviderType;
  name: string;
  isAvailable: boolean;
  lastChecked: number;
  failureCount: number;
  capabilities: string[];
}

class DynamicModelRegistry {
  private models: Map<string, RegisteredModel> = new Map();
  private static instance: DynamicModelRegistry;

  private constructor() {
    this.initDefaultModels();
  }

  public static getInstance(): DynamicModelRegistry {
    if (!DynamicModelRegistry.instance) {
      DynamicModelRegistry.instance = new DynamicModelRegistry();
    }
    return DynamicModelRegistry.instance;
  }

  private initDefaultModels() {
    const defaults: Partial<RegisteredModel>[] = [
      // ── NATIVE GEMINI ──────────────────────────────────────────────────
      { id: 'gemini-1.5-flash', provider: 'gemini', name: 'Gemini 1.5 Flash', capabilities: ['fast'] },
      { id: 'gemini-2.0-flash', provider: 'gemini', name: 'Gemini 2.0 Flash', capabilities: ['vision', 'streaming'] },
      { id: 'gemini-1.5-pro', provider: 'gemini', name: 'Gemini 1.5 Pro', capabilities: ['high-reasoning'] },
      { id: 'gemini-2.0-flash-exp', provider: 'gemini', name: 'Gemini 2.0 Experimental' },
      
      // ── NATIVE GROQ ────────────────────────────────────────────────────
      { id: 'llama-3.3-70b-versatile', provider: 'groq', name: 'Llama 3.3 70B', capabilities: ['fast', 'high-reasoning'] },
      { id: 'llama-3.1-70b-versatile', provider: 'groq', name: 'Llama 3.1 70B' },
      { id: 'mixtral-8x7b-32768', provider: 'groq', name: 'Mixtral 8x7B', capabilities: ['fast'] },
      
      // ── OPENROUTER (Qualified IDs) ─────────────────────────────────────
      { id: 'google/gemini-2.0-flash-001', provider: 'openrouter', name: 'OR Gemini Flash' },
      { id: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter', name: 'OR Llama 3.3' },
      { id: 'deepseek/deepseek-chat', provider: 'openrouter', name: 'DeepSeek V3' },
      { id: 'anthropic/claude-3.5-haiku', provider: 'openrouter', name: 'Claude 3.5 Haiku' },
      { id: 'anthropic/claude-3.5-sonnet', provider: 'openrouter', name: 'Claude 3.5 Sonnet' },
      
      // ── HUGGING FACE ───────────────────────────────────────────────────
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', provider: 'huggingface', name: 'Mistral 7B' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', provider: 'huggingface', name: 'Qwen 2.5' }
    ];

    defaults.forEach(m => {
      this.models.set(m.id!, {
        id: m.id!,
        provider: m.provider!,
        name: m.name!,
        isAvailable: true,
        lastChecked: Date.now(),
        failureCount: 0,
        capabilities: m.capabilities || []
      });
    });
  }

  public getModelsForProvider(provider: ProviderType): RegisteredModel[] {
    return Array.from(this.models.values()).filter(m => m.provider === provider && m.isAvailable);
  }

  public markModelFailure(modelId: string) {
    const m = this.models.get(modelId);
    if (!m) return;

    m.failureCount++;
    m.lastChecked = Date.now();
    
    if (m.failureCount > 3) {
      console.warn(`[REGISTRY] Model ${modelId} marked as UNAVAILABLE due to repeated failures.`);
      m.isAvailable = false;
    }
  }

  public markModelSuccess(modelId: string) {
    const m = this.models.get(modelId);
    if (m) {
      m.failureCount = 0;
      m.isAvailable = true;
      m.lastChecked = Date.now();
    }
  }

  public getBestModel(provider: ProviderType, requiredCapability?: string): string | null {
    const available = this.getModelsForProvider(provider)
      .filter(m => !requiredCapability || m.capabilities.includes(requiredCapability));
    
    return available.length > 0 ? available[0].id : null;
  }

  public getModel(modelId: string): RegisteredModel | undefined {
    return this.models.get(modelId);
  }

  public getProviderForModel(modelId: string): ProviderType {
    if (modelId === 'isagi-autonomous') return 'gemini'; // Orchestrated entry
    
    const m = this.models.get(modelId);
    if (m) return m.provider;

    // Heuristic for unknown models
    if (modelId.includes('/')) return 'openrouter';
    if (modelId.startsWith('gemini')) return 'gemini';
    if (modelId.includes('llama') || modelId.includes('mixtral')) return 'groq';
    
    return 'gemini'; // Default
  }

  public async validateModel(modelId: string): Promise<boolean> {
    const m = this.models.get(modelId);
    if (!m) return false;
    return m.isAvailable;
  }
}

export const modelRegistry = DynamicModelRegistry.getInstance();
