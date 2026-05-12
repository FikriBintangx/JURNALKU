/**
 * ISAGI — Orchestrator (Central Brain)
 * =====================================
 * The main entry point for all ISAGI intelligence operations.
 * 
 * Runs the full pipeline:
 * 1. Intent Detection
 * 2. Memory Recall
 * 3. Planning
 * 4. Autonomous Retrieval (via existing searchAggregator)
 * 5. Source Validation
 * 6. Semantic Processing
 * 7. Cross-Reference Analysis
 * 8. Contextual Reasoning (LLM Synthesis)
 * 9. Self-Reflection
 * 10. Long-Term Knowledge Storage
 * 
 * IMPORTANT: This module wraps existing services.
 * It does NOT replace searchAggregator or geminiService.
 * It orchestrates them intelligently.
 */

import { searchAggregator } from '../searchAggregator';
import { geminiService } from '../geminiService';
import { callGroq, GROQ_MODELS } from '../groqService';
import { callOpenRouter } from '../openRouterService';
import { embeddingService } from '../embeddingService';
import { ISAGIReasoningEngine } from './reasoningEngine';
import { ISAGIMemory } from './memorySystem';
import { ISAGIValidator } from './sourceValidator';
import {
  ISAGIResponse, IntentClassification, ReasoningTrace,
  ToolCall, LongTermMemoryEntry, SourceValidation, ConfidenceLevel
} from './types';
import { UniversalPaperEnriched } from '@/types/search';

// ── Session ID Generator ────────────────────────────────────────────────────
function genSessionId(): string {
  return `ISAGI_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Synthesis Prompt Builder ────────────────────────────────────────────────
function buildSynthesisPrompt(
  query: string,
  intent: IntentClassification,
  papers: UniversalPaperEnriched[],
  memoryContext: string,
  stmContext: string,
  conflicts: Array<{ ids: string[]; signal: string }>
): string {
  const paperContext = papers
    .slice(0, 8)
    .map((p, i) => `[${i + 1}] "${p.title}" (${p.year}, ${p.citations || 0} citations)\n    Abstract: ${(p.abstract || '').slice(0, 300)}`)
    .join('\n\n');

  const conflictNote = conflicts.length > 0
    ? `\n\n⚠️ CONFLICTING EVIDENCE DETECTED in ${conflicts.length} paper pair(s). Acknowledge disagreement and explain both perspectives.`
    : '';

  const memNote = memoryContext
    ? `\n\n📚 RELEVANT MEMORY:\n${memoryContext.slice(0, 400)}`
    : '';

  const stmNote = stmContext
    ? `\n\n💬 CONVERSATION CONTEXT:\n${stmContext.slice(0, 300)}`
    : '';

  const langInstruction = intent.language === 'id'
    ? 'Respond in formal Indonesian (Bahasa Indonesia).'
    : intent.language === 'mixed'
    ? 'Respond in Bahasa Indonesia with occasional English technical terms.'
    : 'Respond in formal English.';

  const intentInstructions: Record<string, string> = {
    research_gap_detection: 'Focus on identifying gaps, limitations, and unexplored areas in the literature.',
    literature_review: 'Synthesize findings across papers, identify themes and consensus.',
    comparative_analysis: 'Compare and contrast the papers. Highlight agreements and disagreements.',
    methodological_inquiry: 'Focus on research methods, approaches, and frameworks discussed.',
    trend_analysis: 'Identify temporal patterns, emerging topics, and direction of the field.',
    citation_analysis: 'Analyze citation patterns, influential papers, and knowledge networks.',
    hypothesis_generation: 'Propose novel research hypotheses grounded in the evidence.',
    factual_lookup: 'Provide a direct, precise answer with supporting evidence.',
    exploratory_research: 'Provide a comprehensive overview of the research landscape.',
    generic: 'Synthesize the most relevant information to answer the query.',
  };

  return `You are ISAGI — Intelligence System for Academic Global Insight. You are a senior research intelligence system.

QUERY: "${query}"

DETECTED INTENT: ${intent.primary} (confidence: ${Math.round(intent.confidence * 100)}%)
DOMAINS: ${intent.domains.join(', ')}
${langInstruction}

INSTRUCTION: ${intentInstructions[intent.primary] || intentInstructions.generic}${conflictNote}${memNote}${stmNote}

RETRIEVED ACADEMIC SOURCES (${papers.length} papers):
${paperContext}

REQUIREMENTS:
1. Think step by step — demonstrate reasoning
2. Cite specific papers by their index [1], [2], etc.
3. Acknowledge uncertainty explicitly
4. Do NOT hallucinate — only use information from the sources above
5. If sources are insufficient, clearly state what additional research is needed
6. End with 2–3 follow-up research questions

FORMAT:
## Analysis
[Your synthesis here]

## Key Findings
- Finding 1 [citation]
- Finding 2 [citation]

## Research Gaps / Next Steps
[What is missing or unexplored]

## Follow-up Questions
1. ...
2. ...
3. ...`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ISAGI ORCHESTRATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ISAGIOrchestrator = {

  async run(
    query: string,
    sessionId: string = genSessionId(),
    options: {
      limit?: number;
      forceRetrieval?: boolean;
      filters?: any;
      maxReflectionCycles?: number;
    } = {}
  ): Promise<ISAGIResponse> {
    const t0 = Date.now();
    const toolsUsed: ToolCall[] = [];
    const limit = options.limit || 15;
    const maxCycles = options.maxReflectionCycles || 1;

    console.log(`\n[ISAGI] ═══════════════════════════════════════`);
    console.log(`[ISAGI] Query: "${query}" | Session: ${sessionId}`);
    console.log(`[ISAGI] ═══════════════════════════════════════`);

    // ── STEP 1: INTENT CLASSIFICATION ───────────────────────────────────────
    const t1 = Date.now();
    const intent = ISAGIReasoningEngine.classifyIntent(query);
    console.log(`[ISAGI:1] Intent: ${intent.primary} | Lang: ${intent.language} | Conf: ${Math.round(intent.confidence * 100)}%`);
    console.log(`[ISAGI:1] Semantic expansions: [${intent.semanticExpansions.slice(0, 4).join(', ')}]`);

    let trace = ISAGIReasoningEngine.buildInitialTrace(query, sessionId);
    trace = ISAGIReasoningEngine.addStep(
      trace, 'Intent Classification',
      'Analyzed query to determine research intent, domains, and semantic expansions',
      `Intent: ${intent.primary}, Domains: ${intent.domains.join(', ')}`,
      intent.confidence,
      undefined, Date.now() - t1
    );

    // ── STEP 2: MEMORY RECALL ────────────────────────────────────────────────
    const t2 = Date.now();
    toolsUsed.push({ tool: 'memory_lookup', reason: 'Check long-term memory for related knowledge', input: { query } });

    const stmContext = ISAGIMemory.getSTMContext(sessionId);
    let memoryHits: LongTermMemoryEntry[] = [];
    let hasMemoryHit = false;

    // Semantic recall using query embedding
    const queryEmbedding = await embeddingService.getEmbedding(query).catch(() => []);
    if (queryEmbedding.length > 0) {
      memoryHits = await ISAGIMemory.semanticRecall(queryEmbedding, 3);
      hasMemoryHit = memoryHits.length > 0;
    }

    const memoryContext = memoryHits.map(m => `${m.concept}: ${m.summary}`).join('\n');
    console.log(`[ISAGI:2] Memory recall: ${memoryHits.length} hits | STM turns: ${stmContext.length > 0 ? 'yes' : 'none'}`);

    trace = ISAGIReasoningEngine.addStep(
      trace, 'Memory Recall',
      'Checked long-term semantic memory for pre-learned knowledge',
      hasMemoryHit ? `Found ${memoryHits.length} related memories` : 'No direct memory hit — retrieval required',
      hasMemoryHit ? 0.8 : 0.3,
      'memory_lookup', Date.now() - t2
    );
    toolsUsed[toolsUsed.length - 1].output = { hits: memoryHits.length };
    toolsUsed[toolsUsed.length - 1].success = true;

    // ── STEP 3: PLANNING ─────────────────────────────────────────────────────
    const plan = ISAGIReasoningEngine.createPlan(query, intent, hasMemoryHit && !options.forceRetrieval);
    console.log(`[ISAGI:3] Plan: ${plan.steps.length} steps | Depth: ${plan.estimatedDepth} | Retrieval: ${plan.retrievalRequired}`);

    trace = ISAGIReasoningEngine.addStep(
      trace, 'Execution Planning',
      'Generated an adaptive research plan based on intent and available memory',
      `${plan.steps.length} steps | Depth: ${plan.estimatedDepth} | Tools: ${plan.toolsRequired.join(', ')}`,
      0.9
    );

    // ── STEP 4: AUTONOMOUS RETRIEVAL ─────────────────────────────────────────
    let papers: UniversalPaperEnriched[] = [];
    let retrievalDone = false;

    if (plan.retrievalRequired || options.forceRetrieval) {
      const t4 = Date.now();
      toolsUsed.push({ tool: 'academic_search', reason: 'Retrieve academic papers for query', input: { query, limit } });

      // Use existing searchAggregator (preserving all existing logic)
      const searchResult = await searchAggregator.search(query, limit, options.filters);
      papers = (searchResult.results || []) as UniversalPaperEnriched[];
      retrievalDone = true;

      console.log(`[ISAGI:4] Retrieved: ${papers.length} papers from academic databases`);

      // Semantic expansion if results are sparse
      if (papers.length < 5 && intent.semanticExpansions.length > 0) {
        console.log(`[ISAGI:4] Sparse results — triggering semantic expansion`);
        toolsUsed.push({ tool: 'semantic_expansion', reason: 'Primary retrieval sparse, expanding semantically', input: { expansions: intent.semanticExpansions } });

        for (const expansion of intent.semanticExpansions.slice(0, 2)) {
          const extra = await searchAggregator.search(expansion, Math.ceil(limit / 2));
          papers = [...papers, ...(extra.results || []) as UniversalPaperEnriched[]];
          if (papers.length >= 8) break;
        }

        // Deduplicate
        const seen = new Set<string>();
        papers = papers.filter(p => {
          const key = p.paperId || p.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        console.log(`[ISAGI:4] After expansion: ${papers.length} papers`);
        toolsUsed[toolsUsed.length - 1].output = { finalCount: papers.length };
        toolsUsed[toolsUsed.length - 1].success = true;
      }

      toolsUsed[toolsUsed.length - 2].output = { count: papers.length };
      toolsUsed[toolsUsed.length - 2].success = papers.length > 0;

      trace = ISAGIReasoningEngine.addStep(
        trace, 'Autonomous Retrieval',
        'Fetched papers from 8 academic providers with semantic expansion on sparse results',
        `${papers.length} papers retrieved`,
        papers.length >= 10 ? 0.9 : papers.length >= 5 ? 0.7 : 0.4,
        'academic_search', Date.now() - t4
      );
    }

    // ── STEP 5: SOURCE VALIDATION ─────────────────────────────────────────────
    const t5 = Date.now();
    toolsUsed.push({ tool: 'cross_reference', reason: 'Validate source quality and trust', input: { paperCount: papers.length } });

    const validations: SourceValidation[] = ISAGIValidator.validateBatch(papers);
    const avgTrust = ISAGIValidator.averageTrustScore(validations);
    const conflicts = ISAGIValidator.detectConflicts(papers);

    // Re-rank by trust + relevance
    papers = ISAGIValidator.rankByTrustAndRelevance(papers, validations);

    console.log(`[ISAGI:5] Trust: avg ${avgTrust}/100 | Conflicts: ${conflicts.length}`);
    toolsUsed[toolsUsed.length - 1].output = { avgTrust, conflicts: conflicts.length };
    toolsUsed[toolsUsed.length - 1].success = true;

    trace = ISAGIReasoningEngine.addStep(
      trace, 'Source Validation',
      'Evaluated source trust, peer-review status, DOI presence, citation count, and venue reputation',
      `Average trust: ${avgTrust}/100 | ${conflicts.length} conflicts detected`,
      avgTrust / 100,
      'cross_reference', Date.now() - t5
    );

    // ── STEP 6: AI SYNTHESIS ─────────────────────────────────────────────────
    const t6 = Date.now();
    const { model, provider, rationale } = ISAGIReasoningEngine.selectModel(intent, plan.estimatedDepth);
    console.log(`[ISAGI:6] Synthesis model: ${model} (${provider}) — ${rationale}`);

    const synthesisPrompt = buildSynthesisPrompt(query, intent, papers, memoryContext, stmContext, conflicts);

    let answer = '';
    let actualModel = model;
    let actualProvider = provider;

    try {
      if (provider === 'groq') {
        answer = await callGroq(synthesisPrompt, model, 20000);
      } else {
        // Default to Gemini
        const res = await geminiService.generateAI({
          paperId: `ISAGI_${sessionId}`,
          type: 'synthesis',
          prompt: synthesisPrompt,
          title: query,
        });
        answer = res.data || res.summary || '';
        if (!answer) throw new Error('EMPTY_GEMINI_RESPONSE');
      }
    } catch (e1: any) {
      console.warn(`[ISAGI:6] Primary synthesis failed: ${e1.message}. Falling back...`);
      try {
        // Fallback to Groq Versatile
        answer = await callGroq(synthesisPrompt, 'llama-3.3-70b-versatile', 20000);
        actualModel = 'llama-3.3-70b-versatile';
        actualProvider = 'groq';
      } catch (e2: any) {
        console.warn(`[ISAGI:6] Groq fallback failed: ${e2.message}. Trying OpenRouter...`);
        try {
          answer = await callOpenRouter(synthesisPrompt, 20000);
          actualModel = 'openrouter-fallback';
          actualProvider = 'openrouter';
        } catch (e3: any) {
          console.error(`[ISAGI:6] All synthesis providers failed`);
          answer = `## Analysis\n\nBased on ${papers.length} retrieved academic sources, the query "${query}" relates to the following key areas: ${intent.domains.join(', ')}.\n\n**Note:** AI synthesis temporarily unavailable. Please review the retrieved sources directly.`;
        }
      }
    }

    console.log(`[ISAGI:6] Synthesis: ${answer.length} chars via ${actualModel}`);
    trace = ISAGIReasoningEngine.addStep(
      trace, 'Contextual Synthesis',
      rationale,
      `Generated ${answer.length} char synthesis via ${actualProvider}`,
      answer.length > 500 ? 0.85 : 0.6,
      actualModel, Date.now() - t6
    );

    // ── STEP 7: SELF-REFLECTION ───────────────────────────────────────────────
    const reflection = ISAGIReasoningEngine.reflect(query, answer, papers.length, avgTrust);
    console.log(`[ISAGI:7] Reflection: complete=${reflection.isComplete} | needs_more=${reflection.needsMoreRetrieval} | conf=${Math.round(reflection.confidenceScore * 100)}%`);

    // If reflection says we need more retrieval and we have cycles left
    if (reflection.needsMoreRetrieval && maxCycles > 0 && papers.length < 3) {
      console.log(`[ISAGI:7] Reflection triggered secondary retrieval cycle`);
      // Run one more cycle with a simplified sub-call (avoid infinite recursion)
      if (intent.semanticExpansions.length > 0) {
        const extra = await searchAggregator.search(intent.semanticExpansions[0], limit);
        papers = [...papers, ...(extra.results || []) as UniversalPaperEnriched[]];
      }
    }

    trace = ISAGIReasoningEngine.addStep(
      trace, 'Self-Reflection',
      'Evaluated answer completeness, source sufficiency, and coherence',
      `Complete: ${reflection.isComplete} | Coherent: ${reflection.isCoherent} | Conf: ${Math.round(reflection.confidenceScore * 100)}%`,
      reflection.confidenceScore
    );
    trace.completedAt = Date.now();

    // ── STEP 8: CONFIDENCE SCORING ────────────────────────────────────────────
    const { level: confidenceLevel } = ISAGIReasoningEngine.evaluateConfidence(
      intent, papers.length, avgTrust, hasMemoryHit
    );
    console.log(`[ISAGI:8] Final confidence: ${confidenceLevel}`);

    // ── STEP 9: MEMORY STORAGE ────────────────────────────────────────────────
    let knowledgeStored = false;
    if (confidenceLevel !== 'low') {
      const paperIds = papers.slice(0, 5).map(p => p.paperId || p.id);
      knowledgeStored = await ISAGIMemory.autoStoreInsights(
        query, answer, intent.domains, paperIds, confidenceLevel as ConfidenceLevel
      );
      // Append to STM
      ISAGIMemory.appendToSTM(sessionId, 'user', query);
      ISAGIMemory.appendToSTM(sessionId, 'assistant', answer.slice(0, 600), paperIds);
      // Store episode
      await ISAGIMemory.storeEpisode({
        sessionId,
        query,
        resolvedAnswer: answer.slice(0, 500),
        paperIds,
        reasoningDepth: plan.estimatedDepth,
        timestamp: Date.now(),
      });
    }
    console.log(`[ISAGI:9] Knowledge stored: ${knowledgeStored}`);

    // ── STEP 10: EXTRACT FOLLOW-UP SUGGESTIONS ────────────────────────────────
    const suggestions = this.extractSuggestions(answer, intent);

    const totalMs = Date.now() - t0;
    console.log(`[ISAGI] ✅ Pipeline complete in ${totalMs}ms | ${papers.length} papers | ${confidenceLevel} confidence\n`);

    return {
      sessionId,
      query,
      answer,
      confidence: confidenceLevel as ConfidenceLevel,
      reasoning: trace,
      sources: validations.slice(0, 10),
      toolsUsed,
      memoryRecalled: memoryHits,
      knowledgeStored,
      intent,
      processingMs: totalMs,
      model: actualModel,
      provider: actualProvider,
      suggestions,
    };
  },

  // ── Utility: Extract follow-up suggestions ─────────────────────────────────
  extractSuggestions(answer: string, intent: IntentClassification): string[] {
    const suggestions: string[] = [];

    // Try to extract "Follow-up Questions" section from answer
    const fqMatch = answer.match(/Follow-up Questions?[\s\S]*?(\n1\..+\n2\..+\n3\..+)/i);
    if (fqMatch) {
      const lines = fqMatch[1].split('\n').filter(l => /^\d+\./.test(l.trim()));
      suggestions.push(...lines.map(l => l.replace(/^\d+\.\s*/, '').trim()).slice(0, 3));
    }

    // Fallback generated suggestions based on intent
    if (suggestions.length === 0) {
      const base = intent.semanticExpansions.slice(0, 2);
      if (base.length > 0) {
        suggestions.push(`What is the current state of research on ${base[0]}?`);
        if (base[1]) suggestions.push(`How does ${base[0]} relate to ${base[1]}?`);
      }
      suggestions.push(`What are the major research gaps in this field?`);
    }

    return suggestions.slice(0, 3);
  },

  // ── Quick Recall (memory-only, no retrieval) ────────────────────────────────
  async recall(query: string, sessionId: string): Promise<{ found: boolean; content: string; hits: LongTermMemoryEntry[] }> {
    const embedding = await embeddingService.getEmbedding(query).catch(() => []);
    const hits = embedding.length > 0 ? await ISAGIMemory.semanticRecall(embedding, 3) : [];
    return {
      found: hits.length > 0,
      content: hits.map(h => `${h.concept}: ${h.summary}`).join('\n\n'),
      hits,
    };
  },
};

/**
 * BACKWARD COMPATIBILITY ALIAS
 * Prevents broken imports across the codebase after rebranding.
 */
export const araiOrchestrator = ISAGIOrchestrator;
