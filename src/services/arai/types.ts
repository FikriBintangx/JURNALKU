/**
 * ISAGI — Autonomous Retrieval-Augmented Intelligence
 * =====================================================
 * Core type definitions for the ISAGI intelligence layer.
 * All ISAGI modules share these contracts.
 */
import { UniversalPaperEnriched } from "@/types/search";
export type { UniversalPaperEnriched };

// ── Core Reasoning ─────────────────────────────────────────────────────────

export type ReasoningDepth = 'shallow' | 'standard' | 'deep' | 'exhaustive' | 'autonomous';
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified' | 'absolute';
export type AgentRole = 
  | 'planner' 
  | 'research_retriever' 
  | 'critic_agent' 
  | 'fact_checker' 
  | 'synthesizer' 
  | 'citation_validator' 
  | 'gap_detector' 
  | 'reflection_engine';

export interface ReasoningStep {
  step: number;
  action: string;
  rationale: string;
  output: string;
  confidence: number; // 0–1
  toolUsed?: string;
  durationMs?: number;
}

export interface ReasoningTrace {
  query: string;
  sessionId: string;
  steps: ReasoningStep[];
  totalConfidence: number;
  requiresRetrieval: boolean;
  retrievalTriggeredAt?: number; // step index
  completedAt: number;
}

// ── Intent Classification ──────────────────────────────────────────────────

export type QueryIntent =
  | 'factual_lookup'
  | 'exploratory_research'
  | 'methodological_inquiry'
  | 'literature_review'
  | 'comparative_analysis'
  | 'hypothesis_generation'
  | 'trend_analysis'
  | 'citation_analysis'
  | 'research_gap_detection'
  | 'conversational'
  | 'generic';

export interface IntentClassification {
  primary: QueryIntent;
  secondary?: QueryIntent;
  confidence: number;
  language: 'id' | 'en' | 'mixed';
  domains: string[];
  entities: string[];           // Named entities detected (authors, institutions, etc.)
  temporalContext?: string;     // e.g. "recent", "2020–2024", "historical"
  semanticExpansions: string[]; // AI-generated query expansions
  methodologyHints: string[];   // Detected research methods
  researchGapSignals: string[]; // Signals pointing to knowledge gaps
}

// ── Memory System ──────────────────────────────────────────────────────────

export interface ShortTermMemory {
  sessionId: string;
  turns: MemoryTurn[];
  currentContext: string;
  activeTopics: string[];
  lastUpdated: number;
}

export interface MemoryTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  queryEmbedding?: number[];
  retrievedPaperIds?: string[];
}

export interface LongTermMemoryEntry {
  id: string;
  concept: string;
  summary: string;
  embedding: number[];
  relatedConcepts: string[];
  sourcePaperIds: string[];
  confidence: ConfidenceLevel;
  accessCount: number;
  createdAt: number;
  lastAccessedAt: number;
  tags: string[];
}

export interface EpisodicMemoryEntry {
  sessionId: string;
  query: string;
  resolvedAnswer: string;
  paperIds: string[];
  reasoningDepth: ReasoningDepth;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  timestamp: number;
}

export interface SemanticMemoryEdge {
  from: string;   // concept
  to: string;     // concept
  relation: 'related_to' | 'method_of' | 'contrasts_with' | 'builds_on' | 'cites' | 'uses_variable' | 'analyzes' | 'uses_methodology';
  weight: number; // 0–1
}

// ── Knowledge Graph ────────────────────────────────────────────────────────

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'paper' | 'author' | 'methodology' | 'institution' | 'venue';
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface KnowledgeGraph {
  nodes: any[];
  links: any[];
}

// ── Source Validation ──────────────────────────────────────────────────────

export type SourceTrustTier = 'tier_1' | 'tier_2' | 'tier_3' | 'unverified';

export interface SourceValidation {
  paperId: string;
  trustTier: SourceTrustTier;
  trustScore: number;         // 0–100
  hasDOI: boolean;
  isPeerReviewed: boolean;
  hasHighCitations: boolean;
  isRecentlyPublished: boolean;
  venue: string;
  venueReputation: 'top' | 'good' | 'average' | 'unknown';
  flags: string[];            // e.g. ["retracted", "preprint_only"]
}

// ── Tool Orchestration ─────────────────────────────────────────────────────

export type ToolName =
  | 'academic_search'
  | 'semantic_expansion'
  | 'citation_analysis'
  | 'pdf_reader'
  | 'web_research'
  | 'memory_lookup'
  | 'summarization'
  | 'gap_detection'
  | 'trend_analysis'
  | 'cross_reference';

export interface ToolCall {
  tool: ToolName;
  reason: string;
  input: Record<string, any>;
  output?: any;
  success?: boolean;
  durationMs?: number;
}

// ── ISAGI Response ──────────────────────────────────────────────────────────

export interface ISAGIResponse {
  sessionId: string;
  query: string;
  answer: string;
  confidence: ConfidenceLevel;
  reasoning: ReasoningTrace;
  sources: SourceValidation[];
  toolsUsed: ToolCall[];
  memoryRecalled: LongTermMemoryEntry[];
  knowledgeStored: boolean;
  intent: IntentClassification;
  processingMs: number;
  model: string;
  provider: string;
  suggestions: string[];        // Follow-up research suggestions
  knowledgeGraph?: KnowledgeGraph;
  confidenceMetrics: {
    evidenceDensity: number;    // 0–1
    sourceReliability: number;  // 0–1
    retrievalQuality: number;   // 0–1
    hallucinationRisk: number;  // 0–1
  };
}

// ── Self-Reflection ────────────────────────────────────────────────────────

export interface ReflectionResult {
  isComplete: boolean;
  isCoherent: boolean;
  sourcesVerified: boolean;
  needsMoreRetrieval: boolean;
  confidenceScore: number;    // 0–1
  weaknesses: string[];
  improvements: string[];
}

// ── Agent Messages ─────────────────────────────────────────────────────────

export interface AgentMessage {
  from: AgentRole;
  to: AgentRole | 'orchestrator';
  type: 'plan' | 'data' | 'validation' | 'synthesis' | 'memory_op' | 'reflection';
  payload: any;
  timestamp: number;
}

export interface AgentPlan {
  steps: PlanStep[];
  estimatedDepth: ReasoningDepth;
  toolsRequired: ToolName[];
  memoryLookupRequired: boolean;
  retrievalRequired: boolean;
}

export interface PlanStep {
  id: number;
  description: string;
  agentRole: AgentRole;
  tool?: ToolName;
  dependsOn?: number[];
  priority: 'critical' | 'important' | 'optional';
}
