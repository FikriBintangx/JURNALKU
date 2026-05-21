import { FeatureType } from './schemas';

export enum ProviderStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  COOLDOWN = 'COOLDOWN'
}

export interface ProviderHealth {
  status: ProviderStatus;
  lastError?: string;
  cooldownUntil?: number;
  consecutiveFailures: number;
}

export const PROVIDER_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash",
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini"
};

class AIHealthSystem {
  private static instance: AIHealthSystem;
  private healthStates: Record<string, ProviderHealth> = {
    gemini: { status: ProviderStatus.HEALTHY, consecutiveFailures: 0 },
    groq: { status: ProviderStatus.HEALTHY, consecutiveFailures: 0 },
    openai: { status: ProviderStatus.HEALTHY, consecutiveFailures: 0 }
  };

  private constructor() {}

  public static getInstance(): AIHealthSystem {
    if (!AIHealthSystem.instance) {
      AIHealthSystem.instance = new AIHealthSystem();
    }
    return AIHealthSystem.instance;
  }

  public getStatus(provider: string): ProviderStatus {
    const health = this.healthStates[provider];
    if (!health) return ProviderStatus.DOWN;

    if (health.status === ProviderStatus.COOLDOWN && health.cooldownUntil && Date.now() > health.cooldownUntil) {
      this.recover(provider);
      return ProviderStatus.HEALTHY;
    }

    return health.status;
  }

  public reportSuccess(provider: string) {
    const health = this.healthStates[provider];
    if (!health) return;
    health.status = ProviderStatus.HEALTHY;
    health.consecutiveFailures = 0;
    health.cooldownUntil = undefined;
    health.lastError = undefined;
  }

  public reportFailure(provider: string, error: any) {
    const health = this.healthStates[provider];
    if (!health) return;

    health.consecutiveFailures++;
    health.lastError = error?.message || String(error);

    const msg = health.lastError.toLowerCase();
    
    // 429 - Quota/Rate Limit
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      health.status = ProviderStatus.COOLDOWN;
      health.cooldownUntil = Date.now() + (3 * 60 * 1000); // 3 minutes cooldown
      console.error(`[AI_HEALTH] [${provider.toUpperCase()}] Rate limited. Cooldown for 3m.`);
    } 
    // 401 - Authentication
    else if (msg.includes('401') || msg.includes('incorrect api key') || msg.includes('invalid api key')) {
      health.status = ProviderStatus.DOWN;
      console.error(`[AI_HEALTH] [${provider.toUpperCase()}] Auth failure. Provider marked as DOWN.`);
    }
    // Generic failures
    else if (health.consecutiveFailures >= 3) {
      health.status = ProviderStatus.DEGRADED;
      health.cooldownUntil = Date.now() + (60 * 1000); // 1 minute degradation
      console.warn(`[AI_HEALTH] [${provider.toUpperCase()}] Multiple failures. Degraded for 1m.`);
    }
  }

  private recover(provider: string) {
    const health = this.healthStates[provider];
    if (health) {
      health.status = ProviderStatus.HEALTHY;
      health.consecutiveFailures = 0;
      console.log(`[AI_HEALTH] [${provider.toUpperCase()}] Recovered to HEALTHY.`);
    }
  }

  public getModel(provider: string, requestedModel?: string): string {
    // If requestedModel matches a specific pattern for this provider, allow it
    // But for stability, we force the mapped models if the requested one is invalid
    if (provider === 'gemini') {
      if (requestedModel?.startsWith('gemini-')) return requestedModel;
      return PROVIDER_MODELS.gemini;
    }
    if (provider === 'groq') {
      if (requestedModel?.includes('llama') || requestedModel?.includes('mixtral')) return requestedModel;
      return PROVIDER_MODELS.groq;
    }
    if (provider === 'openai') {
      if (requestedModel?.startsWith('gpt-')) return requestedModel;
      return PROVIDER_MODELS.openai;
    }
    return PROVIDER_MODELS[provider] || 'gpt-4o-mini';
  }

  public getAllStats() {
    return this.healthStates;
  }
}

export const aiHealth = AIHealthSystem.getInstance();
