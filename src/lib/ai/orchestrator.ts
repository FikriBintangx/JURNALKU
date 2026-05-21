import { FeatureType, FeatureSchemas } from './schemas';
import { FEATURE_PROMPTS, SYSTEM_PROMPT } from './prompts';
import { GeminiProvider, GroqProvider, OpenAIProvider, OpenRouterProvider, AIProvider } from './providers';
import { safeParseJSON } from './parser';
import { HEURISTIC_FALLBACKS } from './fallback';
import { AIError, AIErrorType } from './errors';
import { healthSystem, ProviderStatus } from '../reliability/health';
import { aiQueue } from '../reliability/queue';
import { reliabilityCache } from '../reliability/cache';
import { ResearchCognition, ResearchCognitionSchema } from './schemas';
import { cognitionEngine } from './cognition';
import { COGNITION_PROMPT } from './prompts';

export interface AIResponse<T> {
  success: boolean;
  feature: FeatureType;
  provider: string;
  model: string;
  data: T;
  confidence: number;
  executionTime: number;
  isFallback: boolean;
  error?: string;
  statusMessage?: string;
}

class AIExecutionEngine {
  private providers: AIProvider[] = [
    new GeminiProvider(),
    new GroqProvider(),
    new OpenAIProvider(),
    new OpenRouterProvider()
  ];

  async executeAIFeature<T>(
    feature: FeatureType,
    context: string,
    options: { userId?: string; modelId?: string; paperId?: string } = {}
  ): Promise<AIResponse<T>> {
    const t0 = Date.now();
    
    // 1. Check Cache
    const cacheKey = reliabilityCache.generateKey(`ai:${feature}`, options.paperId || context.slice(0, 50));
    const cachedData = reliabilityCache.get<T>(cacheKey);
    if (cachedData) {
      console.log(`[AI_ENGINE] Cache hit for ${feature}`);
      return {
        success: true,
        feature,
        provider: 'cache',
        model: 'cached',
        data: cachedData,
        confidence: 1.0,
        executionTime: Date.now() - t0,
        isFallback: false
      };
    }

    // 2. Resolve Cognition Context (Shared Intelligence)
    let cognition: ResearchCognition | undefined = options.paperId ? cognitionEngine.getCognition(options.paperId) : undefined;
    
    if (!cognition && options.paperId && feature !== 'graph') {
      try {
        console.log(`[AI_ENGINE] Extracting structural cognition for paper: ${options.paperId}`);
        const cogPrompt = `${SYSTEM_PROMPT}\n\n${COGNITION_PROMPT(context)}`;
        // Try first provider for cognition
        const cogRes = await this.providers[0].execute(cogPrompt, options.modelId);
        const parsedCog = safeParseJSON(cogRes.text);
        const validCog = ResearchCognitionSchema.safeParse(parsedCog);
        if (validCog.success) {
          cognition = validCog.data;
          cognitionEngine.setCognition(options.paperId, cognition);
        }
      } catch (e) {
        console.warn(`[AI_ENGINE] Cognition extraction failed, proceeding with generic analysis.`);
      }
    }

    const prompt = `${SYSTEM_PROMPT}\n\n${FEATURE_PROMPTS[feature](context, cognition)}`;
    const schema = FeatureSchemas[feature];
    
    let lastError: any = null;
    let statusMessage = "Memulai analisis...";

    // Use Queue to limit concurrency
    return await aiQueue(async () => {
        // Try providers based on health and priority
        const sortedProviders = [...this.providers].sort((a, b) => {
            // Priority 0: If modelId is specified, prefer the provider that owns it
            if (options.modelId) {
                const providerForModel = this.getProviderForModel(options.modelId);
                if (a.name === providerForModel && b.name !== providerForModel) return -1;
                if (b.name === providerForModel && a.name !== providerForModel) return 1;
            }

            const statusA = healthSystem.getStatus(a.name);
            const statusB = healthSystem.getStatus(b.name);
            if (statusA === ProviderStatus.HEALTHY && statusB !== ProviderStatus.HEALTHY) return -1;
            if (statusB === ProviderStatus.HEALTHY && statusA !== ProviderStatus.HEALTHY) return 1;
            return healthSystem.getScore(b.name) - healthSystem.getScore(a.name);
        });

        for (const provider of sortedProviders) {
          const status = healthSystem.getStatus(provider.name);
          if (status === ProviderStatus.DOWN || status === ProviderStatus.COOLDOWN) {
              console.log(`[AI_ENGINE] Skipping ${provider.name} (Status: ${status})`);
              continue;
          }

          try {
            console.log(`[AI_ENGINE] Executing ${provider.name} for ${feature}...`);
            statusMessage = `Menganalisis dengan ${provider.name}...`;
            
            const result = await provider.execute(prompt, options.modelId);
            
            // Parsing
            const parsed = safeParseJSON(result.text);
            
            // Validation
            const validated = schema.safeParse(parsed);
            if (!validated.success) {
              console.warn(`[AI_ENGINE] Schema validation failed for ${provider.name}.`);
              throw new AIError(AIErrorType.SCHEMA_ERROR, "Response did not match expected schema", provider.name);
            }

            // Success! Cache it.
            reliabilityCache.set(cacheKey, validated.data);

            return {
              success: true,
              feature,
              provider: result.provider,
              model: result.model,
              data: validated.data as T,
              confidence: 0.95,
              executionTime: Date.now() - t0,
              isFallback: false,
              statusMessage: "Analisis selesai."
            };
          } catch (e: any) {
            lastError = e;
            console.error(`[AI_ENGINE] ${provider.name} failed:`, e.message);
            // Continue to next provider
          }
        }

        // ALL PROVIDERS FAILED - Trigger Fallback
        console.warn(`[AI_ENGINE] All providers failed for ${feature}. Triggering fallback.`);
        const fallbackData = HEURISTIC_FALLBACKS[feature](context);
        
        return {
          success: true,
          feature,
          provider: 'heuristic',
          model: 'local',
          data: fallbackData as T,
          confidence: 0.5,
          executionTime: Date.now() - t0,
          isFallback: true,
          error: lastError?.message || "All AI providers failed",
          statusMessage: "Menggunakan analisis lokal sementara..."
        };
    });
  }

  private getProviderForModel(modelId: string): string {
    if (modelId.includes('/')) return 'openrouter';
    if (modelId.startsWith('gemini')) return 'gemini';
    if (modelId.includes('llama') || modelId.includes('mixtral')) return 'groq';
    if (modelId.startsWith('gpt-')) return 'openai';
    return 'gemini';
  }
}

export const aiEngine = new AIExecutionEngine();
