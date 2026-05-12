/**
 * ISAGI PROVIDER HEALTH MANAGER
 * 
 * Tracks real-time health, latency, success rates, and quota states for all AI providers.
 * Implements sophisticated circuit breaking and intelligent failover logic.
 */

export type ProviderType = 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'embedding';

export type ProviderState = 'healthy' | 'degraded' | 'cooldown' | 'exhausted' | 'offline' | 'unstable';

export interface ProviderStats {
  id: ProviderType;
  state: ProviderState;
  healthScore: number; // 0 to 100
  recentFailures: number;
  totalSuccess: number;
  totalRequests: number;
  cooldownUntil?: number;
  lastLatency?: number;
  avgLatency: number;
  quotaProbability: number; // 0 to 1
  reliabilityScore: number;
  qualityScore: number;
  timeoutRate: number;
}

class ProviderHealthManager {
  private stats: Map<ProviderType, ProviderStats> = new Map();
  private static instance: ProviderHealthManager;

  private constructor() {
    this.initProviders();
  }

  public static getInstance(): ProviderHealthManager {
    if (!ProviderHealthManager.instance) {
      ProviderHealthManager.instance = new ProviderHealthManager();
    }
    return ProviderHealthManager.instance;
  }

  private initProviders() {
    const providers: ProviderType[] = ['gemini', 'groq', 'openrouter', 'huggingface', 'embedding'];
    providers.forEach(p => {
      this.stats.set(p, {
        id: p,
        state: 'healthy',
        healthScore: 100,
        recentFailures: 0,
        totalSuccess: 0,
        totalRequests: 0,
        avgLatency: 0,
        quotaProbability: 0,
        reliabilityScore: 1,
        qualityScore: p === 'gemini' ? 0.9 : p === 'openrouter' ? 0.8 : 0.7,
        timeoutRate: 0
      });
    });
  }

  public trackRequest(provider: ProviderType) {
    const s = this.stats.get(provider);
    if (s) {
      s.totalRequests++;
      // Update state based on current time
      this.checkState(s);
    }
  }

  private checkState(s: ProviderStats) {
    if (s.cooldownUntil && Date.now() < s.cooldownUntil) {
      s.state = 'cooldown';
    } else if (s.healthScore < 20) {
      s.state = 'exhausted';
    } else if (s.healthScore < 50) {
      s.state = 'degraded';
    } else if (s.recentFailures > 5) {
      s.state = 'unstable';
    } else {
      s.state = 'healthy';
    }
  }

  public reportSuccess(provider: ProviderType, latency: number) {
    const s = this.stats.get(provider);
    if (!s) return;

    s.totalSuccess++;
    s.recentFailures = Math.max(0, s.recentFailures - 1);
    s.lastLatency = latency;
    s.avgLatency = s.avgLatency === 0 ? latency : (s.avgLatency * 0.8 + latency * 0.2);
    
    // Gradual health recovery
    s.healthScore = Math.min(100, s.healthScore + 5);
    s.reliabilityScore = Math.min(1, s.reliabilityScore + 0.05);
    s.timeoutRate = s.timeoutRate * 0.9;
    s.quotaProbability = Math.max(0, s.quotaProbability - 0.05);

    this.checkState(s);
    
    if (s.state === 'cooldown' && s.healthScore > 50) {
      console.log(`[HEALTH] Provider ${provider} recovered from cooldown.`);
      s.cooldownUntil = undefined;
    }
  }

  public reportFailure(provider: ProviderType, error: any) {
    const s = this.stats.get(provider);
    if (!s) return;

    const errorMsg = String(error).toLowerCase();
    let errorType: 'rate_limit' | 'missing_model' | 'server_error' | 'timeout' = 'server_error';

    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      errorType = 'rate_limit';
    } else if (errorMsg.includes('404') || errorMsg.includes('model_not_found') || errorMsg.includes('not found')) {
      errorType = 'missing_model';
    } else if (errorMsg.includes('timeout') || errorMsg.includes('deadline')) {
      errorType = 'timeout';
    }

    s.recentFailures++;
    
    let cooldownMinutes = 0;
    switch (errorType) {
      case 'rate_limit':
        s.healthScore = Math.max(0, s.healthScore - 30);
        s.quotaProbability = Math.min(1, s.quotaProbability + 0.3);
        cooldownMinutes = 10;
        break;
      case 'missing_model':
        s.healthScore = Math.max(0, s.healthScore - 50);
        cooldownMinutes = 30; // Mark model invalid logic should handle this elsewhere too
        break;
      case 'server_error':
        s.healthScore = Math.max(0, s.healthScore - 15);
        cooldownMinutes = 2;
        break;
      case 'timeout':
        s.healthScore = Math.max(0, s.healthScore - 10);
        s.timeoutRate = Math.min(1, s.timeoutRate + 0.1);
        cooldownMinutes = 1;
        break;
    }

    if (cooldownMinutes > 0) {
      this.tripCircuit(provider, cooldownMinutes);
    }

    s.reliabilityScore = Math.max(0, s.reliabilityScore - 0.1);
    this.checkState(s);
  }

  private tripCircuit(provider: ProviderType, minutes: number) {
    const s = this.stats.get(provider);
    if (!s) return;

    const until = Date.now() + (minutes * 60 * 1000);
    // Don't override a longer cooldown
    if (!s.cooldownUntil || until > s.cooldownUntil) {
      s.cooldownUntil = until;
      s.state = 'cooldown';
      console.error(`[HEALTH] [CIRCUIT TRIPPED] ${provider.toUpperCase()} cooling down for ${minutes} min.`);
    }
  }

  public isHealthy(provider: ProviderType): boolean {
    const s = this.stats.get(provider);
    if (!s) return false;

    if (s.state === 'cooldown') {
      if (s.cooldownUntil && Date.now() > s.cooldownUntil) {
        return true; // Half-open
      }
      return false;
    }

    if (s.state === 'exhausted' || s.state === 'offline') return false;

    return s.healthScore > 10;
  }

  public getStats(provider: ProviderType): ProviderStats | undefined {
    return this.stats.get(provider);
  }

  public getAllStats(): ProviderStats[] {
    return Array.from(this.stats.values());
  }

  public getBestProvider(candidates: ProviderType[]): ProviderType | null {
    return candidates
      .filter(p => this.isHealthy(p))
      .sort((a, b) => {
        const sa = this.stats.get(a)!;
        const sb = this.stats.get(b)!;
        
        // Complex sorting: health -> reliability -> latency
        const scoreA = (sa.healthScore * 0.4) + (sa.reliabilityScore * 100 * 0.4) - (sa.avgLatency / 100 * 0.2);
        const scoreB = (sb.healthScore * 0.4) + (sb.reliabilityScore * 100 * 0.4) - (sb.avgLatency / 100 * 0.2);
        
        return scoreB - scoreA;
      })[0] || null;
  }

  public getStatusSummary(): string {
    const stats = this.getAllStats();
    const exhausted = stats.filter(s => s.state === 'exhausted' || s.state === 'cooldown').length;
    const total = stats.length;

    if (exhausted === total) return "STATUS KRITIS: Semua provider dalam pemulihan. Mengaktifkan Mode Vektor.";
    if (exhausted > 0) return `STATUS STABIL: ${exhausted} provider dalam antrean pemulihan. Routing cerdas aktif.`;
    return "STATUS OPTIMAL: Semua sistem kognitif berjalan normal.";
  }
}

export const providerHealth = ProviderHealthManager.getInstance();
