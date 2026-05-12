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
import { smartOrchestrator } from './smartOrchestrator';
import { callGroq } from '../groqService';
import { embeddingService } from '../embeddingService';
import { redis } from '@/lib/redis';
import { ISAGIReasoningEngine } from './reasoningEngine';
import { ISAGIMemory } from './memorySystem';
import { graphCognition } from './graphCognition';
import { documentProcessor } from './documentProcessor';
import { responseFormatter } from './formatter';
import { doiEngine } from './doiEngine';
import { ISAGIValidator } from './sourceValidator';
import { agentSwarm } from './agentSwarm';
import { pdfEngine } from './pdfEngine';
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

  const langInstruction = intent.language === 'id'
    ? 'Gunakan Bahasa Indonesia yang formal, cerdas, namun tetap suportif seperti asisten profesor.'
    : 'Use formal academic English with a supportive tone.';

  const paperIntro = papers.length > 0 
    ? `Berikut adalah sumber akademik yang berhasil saya temukan (${papers.length} paper):\n${paperContext}`
    : 'Saya belum menemukan sumber akademik baru untuk saat ini. Mari berdiskusi berdasarkan informasi yang sudah ada.';

  return `Kamu adalah ISAGI (Intelligence System for Academic Global Insight), sebuah AI yang dirancang sebagai Senior Research Assistant profesional dari Indonesia. 
Kepribadianmu: Cerdas, kritis namun sopan, metodis, dan selalu objektif.

KONTEKS PERCAKAPAN SEBELUMNYA:
${stmNote || 'Tidak ada percakapan sebelumnya.'}

PERTANYAAN/INPUT USER: "${query}"
NIAT (INTENT): ${intent.primary}

DETEKSI DOMAIN: ${intent.domains.join(', ')}

INSTRUKSI KHUSUS:
${intentInstructions[intent.primary] || intentInstructions.generic}
${langInstruction}

SUMBER AKADEMIK:
${paperIntro}
${conflictNote}
${memNote}

${responseFormatter.getSystemPromptInjection()}

TUGASMU:
1. Jika user hanya ingin ngobrol atau bertanya hal umum, jawablah dengan cerdas dan hubungkan dengan topik riset jika memungkinkan.
2. Jika user bertanya tentang data, gunakan kutipan [1], [2] dari sumber di atas untuk menjaga akurasi.
3. Jika sumber tidak cukup, berikan hipotesis yang logis atau sarankan pencarian lebih lanjut.
4. Selalu akhiri dengan 2-3 pertanyaan reflektif untuk memancing ide baru user.

FORMAT RESPONS:
SINTESIS PENELITIAN
[Isi sintesis di sini]

TEMUAN KUNCI
• ... [sitasi]

PERTANYAAN LANJUTAN
• ...
• ...`;
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
      onProgress?: (state: string) => void;
    } = {}
  ): Promise<ISAGIResponse> {
    const t0 = Date.now();
    const toolsUsed: ToolCall[] = [];
    const limit = options.limit || 15;
    const maxCycles = options.maxReflectionCycles || 1;
    const onProgress = options.onProgress;

    console.log(`\n[ISAGI] ═══════════════════════════════════════`);
    console.log(`[ISAGI] Query: "${query}" | Session: ${sessionId}`);
    console.log(`[ISAGI] ═══════════════════════════════════════`);
    options.onProgress?.('🧠 Initializing ISAGI Research Kernel...');

    // ── STEP 1: INTENT CLASSIFICATION ───────────────────────────────────────
    const t1 = Date.now();
    const intent = ISAGIReasoningEngine.classifyIntent(query);
    console.log(`[ISAGI:1] Intent: ${intent.primary} | Lang: ${intent.language} | Conf: ${Math.round(intent.confidence * 100)}%`);
    options.onProgress?.(`🔍 ${intent.primary === 'research_gap_detection' ? 'Mendeteksi celah riset...' : 'Menganalisis niat pencarian...'}`);
    options.onProgress?.(`🛡️ ${smartOrchestrator.getStatusSummary()}`);
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
    options.onProgress?.('🧠 Accessing long-term semantic memory...');
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
    options.onProgress?.('📅 Generating autonomous research plan...');
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
      options.onProgress?.(`🌐 Executing cross-provider retrieval (${plan.estimatedDepth} mode)...`);
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

    // ── STEP 5: SOURCE VALIDATION & PDF RAG ──────────────────────────────────
    options.onProgress?.('✅ Validating source quality & extracting deep context...');
    const t5 = Date.now();
    toolsUsed.push({ tool: 'cross_reference', reason: 'Validate source quality and trust', input: { paperCount: papers.length } });

    const validations: SourceValidation[] = ISAGIValidator.validateBatch(papers);
    const avgTrust = ISAGIValidator.averageTrustScore(validations);
    const conflicts = ISAGIValidator.detectConflicts(papers);

    // Deep PDF Extraction for top high-trust papers
    if (plan.estimatedDepth === 'deep' || plan.estimatedDepth === 'exhaustive') {
      const topPapers = papers.slice(0, 2).filter(p => p.pdfUrl && p.pdfUrl.endsWith('.pdf'));
      for (const p of topPapers) {
        options.onProgress?.(`📄 Deep parsing: ${p.title.slice(0, 20)}...`);
        const pdfData = await pdfEngine.processPDF(p.pdfUrl, p.paperId || p.id);
        if (pdfData) {
          p.abstract = `[FULL PDF EXTRACTED]\n${pdfData.fullText.slice(0, 3000)}\n\n[SECTIONS DETECTED]: ${pdfData.metadata.sections.join(', ')}`;
        }
      }
    }

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
    options.onProgress?.('✍️ Synthesizing findings across multi-source context...');
    const t6 = Date.now();
    const { model, provider, rationale } = ISAGIReasoningEngine.selectModel(intent, plan.estimatedDepth);
    console.log(`[ISAGI:6] Synthesis model: ${model} (${provider}) — ${rationale}`);

    const synthesisPrompt = buildSynthesisPrompt(query, intent, papers, memoryContext, stmContext, conflicts);

    // ── STEP 6A: SEMANTIC CACHE LOOKUP ───────────────────────────────────────
    let answer = '';
    const cacheKey = `isagi:synthesis:${Buffer.from(query).toString('base64').slice(0, 32)}`;
    
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[ISAGI:6A] Semantic cache HIT for query`);
          answer = cached as string;
        }
      } catch (e) {}
    }

    let actualModel = 'none';
    let actualProvider = 'none';

    if (!answer) {
      const { model, provider, rationale } = ISAGIReasoningEngine.selectModel(intent, plan.estimatedDepth);
      console.log(`[ISAGI:6] Synthesis via Smart Orchestrator — ${rationale}`);

      const orchestratorRes = await smartOrchestrator.execute({
        prompt: synthesisPrompt,
        type: 'synthesis',
        importance: plan.estimatedDepth === 'deep' ? 'high' : 'standard',
        userId: 'ISAGI_SYSTEM',
        paperId: `ISAGI_${sessionId}`
      });

      answer = orchestratorRes.text;
      actualModel = orchestratorRes.model;
      actualProvider = orchestratorRes.provider;

      // Cache successful non-degraded responses
      if (answer && !orchestratorRes.isDegraded && redis) {
        await redis.set(cacheKey, answer, { ex: 60 * 60 * 12 }).catch(() => {});
      }
    }

    // Apply strict formatting
    answer = responseFormatter.format(answer);

    console.log(`[ISAGI:6] Synthesis: ${answer.length} chars via ${actualModel}`);
    trace = ISAGIReasoningEngine.addStep(
      trace, 'Contextual Synthesis',
      rationale,
      `Generated ${answer.length} char synthesis via ${actualProvider}`,
      answer.length > 500 ? 0.85 : 0.6,
      actualModel, Date.now() - t6
    );

    // ── STEP 7: INTERNAL DEBATE & SWARM VALIDATION ────────────────────────────
    onProgress?.('🤖 Agents debating internally...');
    const t7 = Date.now();
    let finalAnswer = answer;
    let debateResult = '';
    
    if (plan.estimatedDepth === 'deep' || plan.estimatedDepth === 'exhaustive' || intent.confidence < 0.6) {
      console.log(`[ISAGI:7] Low confidence or high depth — triggering agent debate`);
      toolsUsed.push({ tool: 'cross_reference', reason: 'Internal agent debate for quality assurance', input: { initialSynthesis: answer.slice(0, 100) } });
      
      const paperContext = papers.map(p => `Title: ${p.title}\nAbstract: ${p.abstract}`).join('\n\n');
      debateResult = await agentSwarm.debate(paperContext + memoryContext, answer);
      
      // Perform Self-Correction based on debate
      const correctionPrompt = `You are the SYNTHESIZER AGENT. Re-evaluate your previous answer based on the following critique.
      
      ORIGINAL ANSWER:
      ${answer}
      
      CRITIQUE:
      ${debateResult}
      
      TUGAS: Perbaiki jawaban Anda agar lebih akurat, objektif, dan sejalan dengan data paper. Jika ada klaim yang salah, hapus atau revisi.`;
      
      try {
        const corrected = await callGroq(correctionPrompt, 'llama-3.3-70b-versatile', 15000);
        finalAnswer = corrected;
        console.log(`[ISAGI:7] Self-Correction applied. Original: ${answer.length} | New: ${finalAnswer.length}`);
      } catch (err) {
        console.warn(`[ISAGI:7] Self-Correction failed, using original answer.`);
      }
      
      toolsUsed[toolsUsed.length - 1].output = { debateLength: debateResult.length, correctionApplied: finalAnswer !== answer };
      toolsUsed[toolsUsed.length - 1].success = true;
    }

    // ── STEP 8: FACT CHECKING ────────────────────────────────────────────────
    onProgress?.('✅ Verifying citations & checking for hallucinations...');
    const { isValid, issues } = await agentSwarm.factCheck(finalAnswer, papers);
    if (!isValid) {
      console.warn(`[ISAGI:8] Fact check found issues: ${issues.join(', ')}`);
    }

    trace = ISAGIReasoningEngine.addStep(
      trace, 'Swarm Intelligence Debate',
      'Agents debated internally to challenge assumptions and verify conclusions',
      debateResult ? `Debate result: ${debateResult.slice(0, 100)}...` : 'Skipped (sufficient confidence)',
      isValid ? 0.9 : 0.4,
      'critic_agent', Date.now() - t7
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

    // ── STEP 10: KNOWLEDGE GRAPH COGNITION ───────────────────────────────────
    onProgress?.('🕸️ Mapping knowledge graph relationships...');
    const knowledgeGraph = await graphCognition.generateGraph(papers);

    // ── STEP 11: EXTRACT FOLLOW-UP SUGGESTIONS ────────────────────────────────
    const suggestions = this.extractSuggestions(finalAnswer, intent);

    const totalMs = Date.now() - t0;
    console.log(`[ISAGI] ✅ Pipeline complete in ${totalMs}ms | ${papers.length} papers | ${confidenceLevel} confidence\n`);

    return {
      sessionId,
      query,
      answer: finalAnswer,
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
      knowledgeGraph,
      confidenceMetrics: {
        evidenceDensity: papers.length / limit,
        sourceReliability: avgTrust / 100,
        retrievalQuality: papers.length > 0 ? 0.9 : 0.1,
        hallucinationRisk: isValid ? 0.05 : 0.4
      }
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
