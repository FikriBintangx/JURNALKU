import { Journal } from './journal';

export type JournalSource = 'openalex' | 'semantic' | 'crossref' | 'core' | 'all';
export type SortBy = "relevance" | "year" | "citations";
export type ResearchMethod = 'kuantitatif' | 'kualitatif' | 'mixed_method' | 'literature_review' | 'eksperimen' | 'unknown';
export type TopicCategory = 'teknologi' | 'bisnis' | 'pendidikan' | 'kesehatan' | 'sosial' | 'ekonomi' | 'marketing' | 'sains' | 'hukum' | 'lainnya';
export type ComplexityLevel = 'beginner' | 'intermediate' | 'expert';
export type DocumentType = 'journal_article' | 'conference_paper' | 'thesis' | 'review' | 'preprint' | 'unknown';

export interface AIEnrichment {
  relevanceScore: number;
  researchMethod: ResearchMethod;
  category: TopicCategory;
  complexity: ComplexityLevel;
  shortSummary: string;
  aiKeywords: string[];
  enrichedAt: number;
}

export interface ResearchIntelligence {
  intent: 'exploratory' | 'methodological' | 'review' | 'comparative' | 'generic';
  domains: string[];
  keywords: string[];
  questions: string[];
  summary?: string;
}

export interface UniversalPaperEnriched {
  id: string;
  paperId: string;
  title: string;
  abstract: string;
  authors: Array<{ name: string }>;
  year: number;
  citations: number;
  doi: string;
  source: JournalSource | string;
  isOpenAccess: boolean;
  pdfUrl: string;
  url: string;
  externalUrl: string;
  venue: string;
  keywords: string[];
  docType: DocumentType;
  relevanceScore: number;
  embedding?: number[];
  aiEnrichment?: AIEnrichment;
  trendScore?: number;
  isTrending?: boolean;
  isNew?: boolean;     // Published current year or last year
  isRising?: boolean;  // High citation velocity + recent (≤5 yrs)
}

export interface SearchFilters {
  yearStart?: number;
  yearEnd?: number;
  openAccess?: boolean;
  hasPdf?: boolean;
  minCitations?: number;
  sortBy?: SortBy;
  sources?: JournalSource[];
  docType?: DocumentType;
  minRelevanceScore?: number;
  researchMethod?: ResearchMethod;
  category?: TopicCategory;
  complexity?: ComplexityLevel;
  maxCitations?: number;
}

export interface SearchResponse {
  total: number;
  offset: number;
  data: Journal[];
  success?: boolean;
  error?: boolean;
  message?: string;
  intelligence?: ResearchIntelligence;
}
