import { ProviderType } from "./providerHealth";

export interface SafeInferenceResult {
  success: boolean;
  data: string;
  provider: ProviderType;
  model: string;
  errorType?: string;
  retryable?: boolean;
  message?: string;
}

/**
 * EXECUTE PROVIDER SAFELY
 * Standardized wrapper for all provider calls to prevent unhandled rejections
 * and normalize error formats.
 */
export async function executeProviderSafely(
  provider: ProviderType,
  model: string,
  task: () => Promise<string>
): Promise<SafeInferenceResult> {
  try {
    const text = await task();
    return {
      success: true,
      data: text,
      provider,
      model
    };
  } catch (err: any) {
    const message = err.message || 'Unknown provider error';
    const errorType = classifyError(message);
    
    return {
      success: false,
      data: '',
      provider,
      model,
      errorType,
      retryable: errorType === 'RATE_LIMIT' || errorType === 'TIMEOUT' || errorType === 'SERVER_ERROR',
      message
    };
  }
}

function classifyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('429') || m.includes('quota') || m.includes('rate limit')) return 'RATE_LIMIT';
  if (m.includes('404') || m.includes('not found') || m.includes('model_not_found')) return 'MODEL_NOT_FOUND';
  if (m.includes('timeout') || m.includes('deadline')) return 'TIMEOUT';
  if (m.includes('401') || m.includes('403') || m.includes('unauthorized')) return 'AUTH_ERROR';
  return 'SERVER_ERROR';
}
