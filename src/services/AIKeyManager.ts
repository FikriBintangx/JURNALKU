/**
 * Error classification for AI key management.
 * CRITICAL: Only penalize keys for rate limits, not for configuration errors.
 */
export function classifyAIError(error: any): 'RATE_LIMIT' | 'MODEL_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN' {
  const msg = (error?.message || error?.toString() || '').toLowerCase();
  const status = error?.status || error?.code;

  // Rate limit / quota — penalize key with cooldown
  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    status === 429
  ) {
    return 'RATE_LIMIT';
  }

  // Model / config errors — DO NOT penalize key (it's still working)
  if (
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('model') ||
    msg.includes('unsupported') ||
    msg.includes('invalid argument') ||
    msg.includes('invalid model')
  ) {
    return 'MODEL_ERROR';
  }

  // Network / timeout errors — light penalty
  if (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('socket')
  ) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN';
}

interface KeyState {
  key: string;
  projectId: number;
  active: boolean;
  healthy: boolean;
  cooldownUntil?: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccess: number;
  rateLimitCount: number;
  networkFailCount: number;
  lastUsed?: number;
}

import { sendTelegramAlert } from "./telegramService";

// ... (classifyAIError remains same)

class AIKeyManager {
  private keys: KeyState[] = [];
  private static instance: AIKeyManager;
  private currentIndex: number = 0;

  private constructor() {
    this.initKeys();
  }

  public static getInstance(): AIKeyManager {
    if (!AIKeyManager.instance) {
      AIKeyManager.instance = new AIKeyManager();
    }
    return AIKeyManager.instance;
  }

  // ... (initKeys remains same)

  public getBestKey(): string | null {
    const now = Date.now();

    if (this.keys.length === 0) {
      this.initKeys();
      if (this.keys.length === 0) return null;
    }

    // Recover keys whose cooldown has expired
    this.keys.forEach((k) => {
      if (!k.healthy && k.cooldownUntil && now > k.cooldownUntil) {
        k.healthy = true;
        k.cooldownUntil = undefined;
        k.networkFailCount = 0;
        console.log(`[KEY ROTATION] Key recovered — Project ${k.projectId}`);
      }
    });

    const healthyKeys = this.keys.filter((k) => k.active && k.healthy);

    if (healthyKeys.length === 0 && this.keys.length > 0) {
      // 🚨 EMERGENCY: ALL KEYS DOWN
      sendTelegramAlert(
        `🚨 *EMERGENCY: ALL API KEYS EXHAUSTED!*\n\nSemua ${this.keys.length} kunci AI sedang dalam masa cooldown (Rate Limited). Trafik sangat tinggi! Segera tambah kunci baru di .env.`,
        'emergency_all_down'
      );

      // All keys in cooldown — force pick the one with soonest recovery
      const soonest = this.keys
        .filter((k) => k.active)
        .sort((a, b) => (a.cooldownUntil || 0) - (b.cooldownUntil || 0))[0];

      if (soonest) {
        console.warn(`[KEY ROTATION] All keys in cooldown. Force-using Project ${soonest.projectId}.`);
        soonest.healthy = true;
        soonest.cooldownUntil = undefined;
        soonest.totalRequests++;
        soonest.lastUsed = now;
        return soonest.key;
      }
      return null;
    }

    // Round-robin through healthy keys
    for (let i = 0; i < healthyKeys.length; i++) {
      const idx = (this.currentIndex + i) % healthyKeys.length;
      const keyState = healthyKeys[idx];
      this.currentIndex = (idx + 1) % healthyKeys.length;
      keyState.lastUsed = now;
      keyState.totalRequests++;
      console.log(`[KEY ROTATION] Selected Project ${keyState.projectId} (req #${keyState.totalRequests})`);
      return keyState.key;
    }

    return null;
  }

  /**
   * Only call this for RATE_LIMIT and NETWORK_ERROR — NOT for model errors.
   */
  public markFailure(key: string, isRateLimit: boolean = false) {
    const keyState = this.keys.find((k) => k.key === key);
    if (!keyState) return;

    keyState.totalFailures++;

    if (isRateLimit) {
      keyState.rateLimitCount++;
      keyState.healthy = false;
      const cooldownMs = 3 * 60 * 1000; // 3 minutes
      keyState.cooldownUntil = Date.now() + cooldownMs;
      console.error(`[KEY ROTATION] [RATE LIMIT] Project ${keyState.projectId} — cooldown 3 minutes.`);

      // ⚠️ WARNING: KEY RATE LIMITED
      const healthyLeft = this.getHealthyCount();
      sendTelegramAlert(
        `⚠️ *API Key Rate Limited!*\n\nProject ID: ${keyState.projectId}\nKey: \`${this.maskKey(keyState.key)}\`\n\nSisa kunci sehat: *${healthyLeft}*`,
        `rate_limit_${keyState.projectId}`
      );
    } else {
      // Network/transient error
      keyState.networkFailCount = (keyState.networkFailCount || 0) + 1;
      if (keyState.networkFailCount >= 3) {
        keyState.healthy = false;
        keyState.cooldownUntil = Date.now() + (60 * 1000); // 1 minute
        keyState.networkFailCount = 0;
        console.warn(`[KEY ROTATION] [NETWORK] Project ${keyState.projectId} — cooldown 1 minute.`);
      }
    }
  }

  public markSuccess(key: string) {
    const keyState = this.keys.find((k) => k.key === key);
    if (!keyState) return;
    keyState.totalSuccess++;
    keyState.healthy = true;
    keyState.cooldownUntil = undefined;
    keyState.networkFailCount = 0;
  }

  public maskKey(key: string): string {
    if (!key || key.length < 10) return '***';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }

  public getStats() {
    return this.keys.map((k) => ({
      projectId: k.projectId,
      key: this.maskKey(k.key),
      status: k.healthy ? 'HEALTHY' : 'COOLDOWN',
      cooldownRemainMs: k.cooldownUntil ? Math.max(0, k.cooldownUntil - Date.now()) : 0,
      usage: k.totalRequests,
      success: k.totalSuccess,
      failures: k.totalFailures,
      rateLimits: k.rateLimitCount,
    }));
  }

  public getKeyCount(): number {
    return this.keys.length;
  }

  public getHealthyCount(): number {
    return this.keys.filter((k) => k.healthy && k.active).length;
  }
}

export const aiKeyManager = AIKeyManager.getInstance();
