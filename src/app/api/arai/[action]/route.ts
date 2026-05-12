/**
 * ARAI — Public API Routes
 * =========================
 * 
 * Endpoints:
 * POST /api/arai/ask          — Full autonomous Q&A with reasoning
 * POST /api/arai/research     — Deep research mode (exhaustive retrieval)
 * POST /api/arai/reason       — Reasoning trace only (no LLM synthesis)
 * POST /api/arai/memory/store — Manually store a knowledge entry
 * GET  /api/arai/memory/stats — Memory system statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { araiOrchestrator } from '@/services/arai/orchestrator';
import { ISAGIMemory as araiMemory } from '@/services/arai/memorySystem';
import { ISAGIReasoningEngine as araiReasoningEngine } from '@/services/arai/reasoningEngine';

// ── Shared error helper ─────────────────────────────────────────────────────
function jsonError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── POST /api/arai/ask ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const pathname = new URL(req.url).pathname;

  try {
    const body = await req.json().catch(() => ({}));

    // ── /api/arai/ask ───────────────────────────────────────────────────────
    if (pathname.endsWith('/ask') || pathname.endsWith('/research')) {
      const { query, sessionId, limit, forceRetrieval, filters, mode } = body;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return jsonError('query is required and must be at least 2 characters', 400);
      }

      const isResearchMode = pathname.endsWith('/research') || mode === 'research';

      const result = await araiOrchestrator.run(
        query.trim(),
        sessionId,
        {
          limit: isResearchMode ? 25 : (limit || 15),
          forceRetrieval: isResearchMode ? true : (forceRetrieval || false),
          filters,
          maxReflectionCycles: isResearchMode ? 2 : 1,
        }
      );

      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        query: result.query,
        answer: result.answer,
        confidence: result.confidence,
        intent: {
          primary: result.intent.primary,
          domains: result.intent.domains,
          language: result.intent.language,
          suggestions: result.suggestions,
        },
        sources: result.sources.slice(0, 6).map(s => ({
          paperId: s.paperId,
          trustTier: s.trustTier,
          trustScore: s.trustScore,
          venueReputation: s.venueReputation,
          flags: s.flags,
        })),
        reasoning: {
          steps: result.reasoning.steps.length,
          totalConfidence: Math.round(result.reasoning.totalConfidence * 100),
          depth: result.reasoning.steps.length > 8 ? 'exhaustive' :
                 result.reasoning.steps.length > 6 ? 'deep' :
                 result.reasoning.steps.length > 4 ? 'standard' : 'shallow',
        },
        memoryRecalled: result.memoryRecalled.length,
        knowledgeStored: result.knowledgeStored,
        processingMs: result.processingMs,
        model: result.model,
        provider: result.provider,
      });
    }

    // ── /api/arai/reason ────────────────────────────────────────────────────
    if (pathname.endsWith('/reason')) {
      const { query, sessionId } = body;
      if (!query) return jsonError('query required', 400);

      const intent = araiReasoningEngine.classifyIntent(query);
      const plan = araiReasoningEngine.createPlan(query, intent, false);
      const model = araiReasoningEngine.selectModel(intent, plan.estimatedDepth);

      return NextResponse.json({
        success: true,
        intent,
        plan: {
          steps: plan.steps.map(s => ({
            id: s.id,
            description: s.description,
            agentRole: s.agentRole,
            tool: s.tool,
            priority: s.priority,
          })),
          estimatedDepth: plan.estimatedDepth,
          toolsRequired: plan.toolsRequired,
          retrievalRequired: plan.retrievalRequired,
        },
        modelRouting: model,
      });
    }

    // ── /api/arai/memory/store ──────────────────────────────────────────────
    if (pathname.includes('/memory/store')) {
      const { concept, summary, tags, confidence } = body;
      if (!concept || !summary) return jsonError('concept and summary required', 400);

      const stored = await araiMemory.storeLTM({
        concept,
        summary,
        embedding: [],
        relatedConcepts: tags || [],
        sourcePaperIds: [],
        confidence: confidence || 'medium',
        tags: tags || [],
      });

      return NextResponse.json({ success: stored, concept });
    }

    return jsonError('Unknown ARAI endpoint', 404);

  } catch (err: any) {
    console.error('[ARAI:API] Unhandled error:', err.message);
    return jsonError(`ARAI error: ${err.message}`);
  }
}

// ── GET /api/arai/memory/stats ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const stats = await araiMemory.getStats();
    return NextResponse.json({ success: true, memory: stats });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
