import { z } from 'zod';

export const SummarySchema = z.object({
  overview: z.string(),
  keyFindings: z.array(z.string()),
  methodology: z.string(),
  limitations: z.array(z.string()),
  report: z.string().optional(), // New cinematic markdown report
});

export const KeywordSchema = z.object({
  keywords: z.array(z.string()),
  categories: z.array(z.string()),
  relevanceScores: z.record(z.string(), z.number()),
});

export const TitleSchema = z.object({
  suggestedTitles: z.array(z.string()),
  analysis: z.string(),
});

export const CitationSchema = z.object({
  explanation: z.string(),
  format: z.string(),
  context: z.string(),
});

export const RecommendationSchema = z.object({
  relatedPapers: z.array(z.object({
    title: z.string(),
    reason: z.string(),
    confidence: z.number()
  })),
  futureDirections: z.array(z.string()),
});

export const ComparisonSchema = z.object({
  similarities: z.array(z.string()),
  differences: z.array(z.string()),
  uniqueContributions: z.array(z.string()),
});

export const MethodologyCriticSchema = z.object({
  credibilityScore: z.number().min(0).max(100),
  reasoningChain: z.array(z.string()),
  evidenceBase: z.array(z.string()),
  risks: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  samplingQuality: z.string(),
  reproducibilityAnalysis: z.string(),
  replicationChance: z.enum(['High', 'Medium', 'Low', 'Very Low']),
});

export const GraphExtractionSchema = z.object({
  entities: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['Concept', 'Method', 'Dataset', 'Author', 'Theory', 'Finding'])
  })),
  relations: z.array(z.object({
    source: z.string(),
    target: z.string(),
    label: z.enum(['supports', 'contradicts', 'improves', 'inspired_by', 'measured_by', 'uses'])
  }))
});

export type FeatureType = 
  | 'summary' 
  | 'keywords' 
  | 'titles' 
  | 'citation' 
  | 'recommendations' 
  | 'comparison' 
  | 'critic' 
  | 'graph';

export const FeatureSchemas = {
  summary: SummarySchema,
  keywords: KeywordSchema,
  titles: TitleSchema,
  citation: CitationSchema,
  recommendations: RecommendationSchema,
  comparison: ComparisonSchema,
  critic: MethodologyCriticSchema,
  graph: GraphExtractionSchema,
};

export const ResearchCognitionSchema = z.object({
  paperId: z.string().optional(),
  domain: z.string(),
  entities: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.string(),
    significance: z.string()
  })),
  methodologies: z.array(z.object({
    name: z.string(),
    rigor: z.number(),
    description: z.string()
  })),
  noveltySignals: z.array(z.string()),
  researchGaps: z.array(z.string()),
  inferredContributions: z.array(z.string()),
  confidenceEngine: z.object({
    score: z.number(),
    factors: z.array(z.string()),
    limitations: z.array(z.string())
  })
});

export type ResearchCognition = z.infer<typeof ResearchCognitionSchema>;
