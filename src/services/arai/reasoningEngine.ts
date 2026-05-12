/**
 * ISAGI — Reasoning Engine
 * ========================
 * Chain-of-Thought reasoning layer that thinks before responding.
 * 
 * Principles:
 * 1. Think → Plan → Verify → Synthesize → Respond
 * 2. Never answer immediately
 * 3. Detect when retrieval is required
 * 4. Recursively improve weak answers
 */

import { callGroq, GROQ_MODELS } from '../groqService';

// Named aliases for model routing
const GROQ_MODEL_IDS = {
  FAST:       GROQ_MODELS[1]?.id || 'llama-3.1-8b-instant',      // 8B Instant — ultra-fast
  VERSATILE:  GROQ_MODELS[0]?.id || 'llama-3.3-70b-versatile',   // 70B — quality
};
import {
  ReasoningTrace, ReasoningStep, ReasoningDepth,
  IntentClassification, QueryIntent, ReflectionResult, AgentPlan, PlanStep, ToolName
} from './types';

// ── Intent Classification ──────────────────────────────────────────────────

const INTENT_PATTERNS: Record<QueryIntent, { patterns: RegExp[]; weight: number }> = {
  factual_lookup:         { patterns: [/apa itu|what is|define|pengertian|definisi/i], weight: 0.8 },
  exploratory_research:   { patterns: [/penelitian|research|studi|kajian|explore/i], weight: 0.9 },
  methodological_inquiry: { patterns: [/metode|methodology|approach|teknik|framework/i], weight: 0.95 },
  literature_review:      { patterns: [/review|tinjauan|literatur|systematic|meta.analys/i], weight: 0.9 },
  comparative_analysis:   { patterns: [/banding|compar|versus|vs\.|perbedaan|difference/i], weight: 0.85 },
  hypothesis_generation:  { patterns: [/hipotesis|hypothesis|prediksi|predict|forecast/i], weight: 0.8 },
  trend_analysis:         { patterns: [/tren|trend|emerging|perkembangan|recent|terbaru/i], weight: 0.85 },
  citation_analysis:      { patterns: [/citasi|citation|dikutip|cited|reference/i], weight: 0.9 },
  research_gap_detection: { patterns: [/gap|celah|kekurangan|limitation|missing|belum diteliti/i], weight: 0.95 },
  conversational:         { patterns: [/halo|hai|hey|kamu siapa|tanya dong|jelaskan lagi|maksudnya|bisa bantu|oke|siap/i], weight: 0.7 },
  generic:                { patterns: [/.*/], weight: 0.1 },
};

const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  'Technology & CS':       [/teknologi|ai|machine learning|deep learning|nlp|software|programming/i],
  'Social Sciences':       [/sosial|behavior|perilaku|psychology|sosiologi|komunikasi/i],
  'Business & Economics':  [/bisnis|ekonomi|marketing|umkm|entrepreneur|manajemen/i],
  'Education':             [/pendidikan|education|pembelajaran|teaching|student|mahasiswa/i],
  'Health & Medicine':     [/kesehatan|health|medical|clinical|covid|penyakit/i],
  'Law & Policy':          [/hukum|law|policy|regulation|kebijakan/i],
  'Science & Engineering': [/sains|fisika|kimia|biologi|teknik|engineering/i],
};

// ── Semantic Expansion Map ─────────────────────────────────────────────────

const SEMANTIC_MAP: Record<string, string[]> = {
  'gen z': ['generation z', 'digital natives', 'youth consumer behavior', 'post-millennial', 'zoomers'],
  'tiktok': ['short-form video', 'social commerce', 'viral content', 'influencer marketing'],
  'umkm': ['small medium enterprise', 'SME', 'usaha kecil menengah', 'microfinance', 'informal economy'],
  'ai': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning'],
  'covid': ['SARS-CoV-2', 'pandemic', 'coronavirus', 'public health emergency'],
  'blockchain': ['distributed ledger', 'smart contract', 'cryptocurrency', 'web3'],
  'pendidikan': ['education', 'learning outcomes', 'pedagogy', 'curriculum design'],
  'kesehatan mental': ['mental health', 'psychological wellbeing', 'depression', 'anxiety disorders'],
  'e-commerce': ['online shopping', 'digital marketplace', 'consumer behavior', 'purchase intention'],
  'metode penelitian': ['research methodology', 'mixed methods', 'qualitative research', 'quantitative study'],
};

export const ISAGIReasoningEngine = {

  // ── 1. Intent Classification ─────────────────────────────────────────────

  classifyIntent(query: string): IntentClassification {
    const q = query.toLowerCase();
    let topIntent: QueryIntent = 'generic';
    let topWeight = 0;
    let secondaryIntent: QueryIntent | undefined;
    let secondaryWeight = 0;

    for (const [intent, config] of Object.entries(INTENT_PATTERNS) as [QueryIntent, any][]) {
      const matched = config.patterns.some((p: RegExp) => p.test(q));
      if (matched && config.weight > topWeight) {
        secondaryIntent = topIntent;
        secondaryWeight = topWeight;
        topIntent = intent;
        topWeight = config.weight;
      }
    }

    const domains: string[] = [];
    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      if (patterns.some(p => p.test(q))) domains.push(domain);
    }

    const semanticExpansions = this.getSemanticExpansions(q);
    const methodologyHints = this.detectMethodologyHints(q);
    const researchGapSignals = this.detectGapSignals(q);
    const language = this.detectLanguage(q);
    const entities = this.extractEntities(query);

    return {
      primary: topIntent,
      secondary: secondaryWeight > 0.5 ? secondaryIntent : undefined,
      confidence: topWeight,
      language,
      domains: domains.length > 0 ? domains : ['Multidisciplinary'],
      entities,
      semanticExpansions,
      methodologyHints,
      researchGapSignals,
    };
  },

  getSemanticExpansions(query: string): string[] {
    const expansions: string[] = [];
    for (const [key, related] of Object.entries(SEMANTIC_MAP)) {
      if (query.includes(key)) {
        expansions.push(...related.slice(0, 3));
      }
    }
    const words = query.split(/\s+/).filter(w => w.length > 3);
    return [...new Set([...expansions, ...words.slice(0, 3)])].slice(0, 8);
  },

  detectMethodologyHints(query: string): string[] {
    const hints: string[] = [];
    if (/kuantitatif|quantitative|survey|kuesioner|questionnaire/i.test(query)) hints.push('quantitative');
    if (/kualitatif|qualitative|wawancara|interview|observasi/i.test(query)) hints.push('qualitative');
    if (/mixed method|campuran/i.test(query)) hints.push('mixed_methods');
    if (/review|meta.analys|systematic/i.test(query)) hints.push('literature_review');
    if (/eksperimen|experiment|randomized|control/i.test(query)) hints.push('experimental');
    return hints;
  },

  detectGapSignals(query: string): string[] {
    const signals: string[] = [];
    if (/gap|celah|kekurangan/i.test(query)) signals.push('explicit_gap_request');
    if (/terbaru|recent|emerging|baru/i.test(query)) signals.push('recency_bias');
    if (/indonesia/i.test(query)) signals.push('indonesia_context');
    if (/belum|not yet|lacking/i.test(query)) signals.push('absence_signal');
    return signals;
  },

  detectLanguage(query: string): 'id' | 'en' | 'mixed' {
    const idWords = (query.match(/\b(dan|yang|untuk|dengan|dalam|dari|ini|itu|adalah|pada|ke|di|atau|jurnal|penelitian)\b/gi) || []).length;
    const enWords = (query.match(/\b(the|of|and|in|for|with|research|study|analysis|impact|effect)\b/gi) || []).length;
    if (idWords > enWords * 1.5) return 'id';
    if (enWords > idWords * 1.5) return 'en';
    return 'mixed';
  },

  extractEntities(query: string): string[] {
    const entities: string[] = [];
    // Simple capitalized word extraction (proper nouns)
    const caps = query.match(/\b[A-Z][a-z]+\b/g) || [];
    // Year extraction
    const years = query.match(/\b(19|20)\d{2}\b/g) || [];
    return [...new Set([...caps, ...years])].slice(0, 5);
  },

  // ── 2. Planning ───────────────────────────────────────────────────────────

  createPlan(query: string, intent: IntentClassification, hasCachedMemory: boolean): AgentPlan {
    const steps: PlanStep[] = [];
    const tools: ToolName[] = [];
    let requiresRetrieval = true;
    let id = 1;

    // Always start with memory lookup
    steps.push({
      id: id++,
      description: 'Check long-term memory for cached knowledge about this query',
      agentRole: 'research_retriever',
      tool: 'memory_lookup',
      priority: 'critical',
    });
    tools.push('memory_lookup');

    if (!hasCachedMemory && intent.primary !== 'conversational') {
      // Academic retrieval
      steps.push({
        id: id++,
        description: `Search academic databases for: "${query}" with semantic expansion`,
        agentRole: 'research_retriever',
        tool: 'academic_search',
        dependsOn: [1],
        priority: 'critical',
      });
      tools.push('academic_search');

      // Semantic expansion if needed
      if (intent.semanticExpansions.length > 2) {
        steps.push({
          id: id++,
          description: 'Expand query semantically and run secondary retrieval',
          agentRole: 'research_retriever',
          tool: 'semantic_expansion',
          dependsOn: [2],
          priority: 'important',
        });
        tools.push('semantic_expansion');
      }
    } else if (intent.primary === 'conversational') {
      requiresRetrieval = false;
      steps.push({
        id: id++,
        description: 'Analyze conversation history and context to provide a helpful response',
        agentRole: 'synthesizer',
        priority: 'critical',
      });
    } else {
      requiresRetrieval = false;
    }

    // Source validation
    steps.push({
      id: id++,
      description: 'Validate retrieved sources — check DOI, citations, peer-review status',
      agentRole: 'citation_validator',
      tool: 'cross_reference',
      dependsOn: [2],
      priority: 'important',
    });

    // Intent-specific analysis steps
    if (intent.primary === 'research_gap_detection') {
      steps.push({
        id: id++,
        description: 'Detect research gaps in retrieved literature',
        agentRole: 'gap_detector',
        tool: 'gap_detection',
        priority: 'critical',
      });
      tools.push('gap_detection');
    }

    if (intent.primary === 'trend_analysis') {
      steps.push({
        id: id++,
        description: 'Analyze citation velocity and publication trends',
        agentRole: 'research_retriever',
        tool: 'trend_analysis',
        priority: 'important',
      });
      tools.push('trend_analysis');
    }

    if (intent.primary === 'citation_analysis') {
      steps.push({
        id: id++,
        description: 'Deep citation network analysis',
        agentRole: 'research_retriever',
        tool: 'citation_analysis',
        priority: 'critical',
      });
      tools.push('citation_analysis');
    }

    // Synthesis
    steps.push({
      id: id++,
      description: 'Synthesize all retrieved knowledge into a coherent, contextualized response',
      agentRole: 'synthesizer',
      priority: 'critical',
    });

    // Reflection
    steps.push({
      id: id++,
      description: 'Self-reflect: Is the answer complete? Does it need more retrieval?',
      agentRole: 'reflection_engine',
      priority: 'important',
    });

    // Memory storage
    steps.push({
      id: id++,
      description: 'Store important concepts to long-term memory for future queries',
      agentRole: 'research_retriever',
      tool: 'memory_lookup',
      priority: 'optional',
    });

    const depth: ReasoningDepth =
      steps.length > 8 ? 'exhaustive' :
      steps.length > 6 ? 'deep' :
      steps.length > 4 ? 'standard' : 'shallow';

    return {
      steps,
      estimatedDepth: depth,
      toolsRequired: [...new Set(tools)],
      memoryLookupRequired: true,
      retrievalRequired: requiresRetrieval,
    };
  },

  // ── 3. Reasoning Trace Builder ────────────────────────────────────────────

  buildInitialTrace(query: string, sessionId: string): ReasoningTrace {
    return {
      query,
      sessionId,
      steps: [],
      totalConfidence: 0,
      requiresRetrieval: true,
      completedAt: 0,
    };
  },

  addStep(
    trace: ReasoningTrace,
    action: string,
    rationale: string,
    output: string,
    confidence: number,
    toolUsed?: string,
    durationMs?: number
  ): ReasoningTrace {
    const step: ReasoningStep = {
      step: trace.steps.length + 1,
      action,
      rationale,
      output,
      confidence,
      toolUsed,
      durationMs,
    };
    trace.steps.push(step);
    trace.totalConfidence = trace.steps.reduce((sum, s) => sum + s.confidence, 0) / trace.steps.length;
    return trace;
  },

  // ── 4. Self-Reflection ────────────────────────────────────────────────────

  reflect(
    query: string,
    answer: string,
    sourceCount: number,
    avgTrustScore: number
  ): ReflectionResult {
    const weaknesses: string[] = [];
    const improvements: string[] = [];
    let confidence = 0.5;

    // Answer completeness
    const isComplete = answer.length > 200;
    if (!isComplete) { weaknesses.push('Answer too brief'); improvements.push('Retrieve more sources'); }
    else confidence += 0.1;

    // Source sufficiency
    const sourcesVerified = sourceCount >= 3;
    if (!sourcesVerified) { weaknesses.push('Insufficient sources'); improvements.push('Run secondary retrieval'); }
    else confidence += 0.15;

    // Trust score
    if (avgTrustScore > 70) confidence += 0.2;
    else { weaknesses.push('Low source authority'); improvements.push('Filter by peer-reviewed only'); }

    // Coherence check (basic heuristic)
    const isCoherent = !answer.includes('[MISSING]') && !answer.includes('[ERROR]');
    if (!isCoherent) { weaknesses.push('Response contains placeholders'); improvements.push('Regenerate with better context'); }
    else confidence += 0.1;

    // Retrieval need check
    const needsMoreRetrieval = sourceCount < 3 || avgTrustScore < 50;

    return {
      isComplete,
      isCoherent,
      sourcesVerified,
      needsMoreRetrieval,
      confidenceScore: Math.min(confidence, 1),
      weaknesses,
      improvements,
    };
  },

  // ── 5. Confidence Evaluation ──────────────────────────────────────────────

  evaluateConfidence(
    intent: IntentClassification,
    sourceCount: number,
    avgRelevanceScore: number,
    hasMemoryHit: boolean
  ): { level: 'low' | 'medium' | 'high' | 'verified'; score: number } {
    let score = 0;

    if (hasMemoryHit) score += 25;
    if (sourceCount >= 10) score += 30;
    else if (sourceCount >= 5) score += 20;
    else if (sourceCount >= 2) score += 10;

    if (avgRelevanceScore >= 70) score += 25;
    else if (avgRelevanceScore >= 50) score += 15;
    else score += 5;

    if (intent.confidence >= 0.85) score += 20;
    else if (intent.confidence >= 0.65) score += 10;

    const level: 'low' | 'medium' | 'high' | 'verified' =
      score >= 80 ? 'verified' :
      score >= 55 ? 'high' :
      score >= 35 ? 'medium' : 'low';

    return { level, score };
  },

  // ── 6. Model Router ───────────────────────────────────────────────────────

  selectModel(intent: IntentClassification, depth: ReasoningDepth): {
    model: string;
    provider: 'gemini' | 'groq' | 'openrouter';
    rationale: string;
  } {
    // Fast tasks → Groq 8B (ultra-fast inference)
    if (depth === 'shallow' || intent.primary === 'factual_lookup') {
      return {
        model: GROQ_MODEL_IDS.FAST,
        provider: 'groq',
        rationale: 'Fast factual lookup — using Groq 8B for low latency',
      };
    }

    // Deep reasoning tasks → Gemini
    if (depth === 'deep' || depth === 'exhaustive' ||
        ['literature_review', 'comparative_analysis', 'research_gap_detection'].includes(intent.primary)) {
      return {
        model: 'gemini-2.0-flash',
        provider: 'gemini',
        rationale: 'Complex reasoning task — using Gemini for quality synthesis',
      };
    }

    // Standard tasks → Groq 70B (balanced speed + quality)
    return {
      model: GROQ_MODEL_IDS.VERSATILE,
      provider: 'groq',
      rationale: 'Balanced task — using Groq 70B for speed+quality tradeoff',
    };
  },
};
