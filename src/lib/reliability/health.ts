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
  score: number;
}

class ProviderHealthSystem {
  private static instance: ProviderHealthSystem;
  private healthStates: Record<string, ProviderHealth> = {};

  private constructor() {}

  public static getInstance(): ProviderHealthSystem {
    if (!ProviderHealthSystem.instance) {
      ProviderHealthSystem.instance = new ProviderHealthSystem();
    }
    return ProviderHealthSystem.instance;
  }

  private initProvider(provider: string) {
    if (!this.healthStates[provider]) {
      this.healthStates[provider] = {
        status: ProviderStatus.HEALTHY,
        consecutiveFailures: 0,
        score: 100
      };
    }
  }

  public getStatus(provider: string): ProviderStatus {
    this.initProvider(provider);
    const health = this.healthStates[provider];

    if (health.status === ProviderStatus.COOLDOWN && health.cooldownUntil && Date.now() > health.cooldownUntil) {
      this.recover(provider);
      return ProviderStatus.HEALTHY;
    }

    if (health.status === ProviderStatus.DOWN && health.cooldownUntil && Date.now() > health.cooldownUntil) {
        this.recover(provider);
        return ProviderStatus.HEALTHY;
    }

    return health.status;
  }

  public reportSuccess(provider: string) {
    this.initProvider(provider);
    const health = this.healthStates[provider];
    health.status = ProviderStatus.HEALTHY;
    health.consecutiveFailures = 0;
    health.cooldownUntil = undefined;
    health.lastError = undefined;
    health.score = Math.min(100, health.score + 5);
  }

  public reportFailure(provider: string, error: any) {
    this.initProvider(provider);
    const health = this.healthStates[provider];
    
    health.consecutiveFailures++;
    health.lastError = error?.message || String(error);
    health.score = Math.max(0, health.score - 15);

    const msg = (health.lastError || '').toLowerCase();
    
    // 429 - Rate Limit
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      health.status = ProviderStatus.COOLDOWN;
      health.cooldownUntil = Date.now() + (3 * 60 * 1000); // 3m cooldown
      console.error(`[HEALTH] [${provider.toUpperCase()}] Rate limited. Cooldown for 3m.`);
    } 
    // 401 - Auth
    else if (msg.includes('401') || msg.includes('key') || msg.includes('auth')) {
      health.status = ProviderStatus.DOWN;
      health.cooldownUntil = Date.now() + (30 * 60 * 1000); // 30m down for manual fix
      console.error(`[HEALTH] [${provider.toUpperCase()}] Auth failure. Marked as DOWN.`);
    }
    // DNS / Network
    else if (msg.includes('enotfound') || msg.includes('econnrefused')) {
      health.status = ProviderStatus.DOWN;
      health.cooldownUntil = Date.now() + (5 * 60 * 1000); // 5m down
      console.error(`[HEALTH] [${provider.toUpperCase()}] Network failure. Marked as DOWN.`);
    }
    // Timeout or generic
    else if (msg.includes('timeout') || health.consecutiveFailures >= 3) {
      health.status = ProviderStatus.DEGRADED;
      health.cooldownUntil = Date.now() + (60 * 1000); // 1m degraded
      console.warn(`[HEALTH] [${provider.toUpperCase()}] Degraded after failures.`);
    }
  }

  private recover(provider: string) {
    const health = this.healthStates[provider];
    if (health) {
      health.status = ProviderStatus.HEALTHY;
      health.consecutiveFailures = 0;
      health.score = Math.max(50, health.score); // Recover to baseline
      console.log(`[HEALTH] [${provider.toUpperCase()}] Auto-recovered to HEALTHY.`);
    }
  }

  public getScore(provider: string): number {
    return this.healthStates[provider]?.score || 0;
  }
}

export const healthSystem = ProviderHealthSystem.getInstance();
