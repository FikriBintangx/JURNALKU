// ─────────────────────────────────────────────────────────────
// TypeScript Types for JurnalStar Smart Filtering System
// ─────────────────────────────────────────────────────────────

export type JournalSource = 'openalex' | 'semantic' | 'crossref' | 'core' | 'all';
export type SortBy = 'relevance' | 'year_desc' | 'year_asc' | 'citations_desc' | 'citations_asc';
export type ResearchMethod = 'kuantitatif' | 'kualitatif' | 'mixed_method' | 'literature_review' | 'eksperimen' | 'unknown';
export type TopicCategory = 'teknologi' | 'bisnis' | 'pendidikan' | 'kesehatan' | 'sosial' | 'ekonomi' | 'marketing' | 'sains' | 'hukum' | 'lainnya';
export type ComplexityLevel = 'beginner' | 'intermediate' | 'expert';
export type DocumentType = 'journal_article' | 'conference_paper' | 'thesis' | 'review' | 'preprint' | 'unknown';

export interface SearchFilters {
  // Publication
  yearStart?: number;
  yearEnd?: number;
  sortBy?: SortBy;

  // Citations
  minCitations?: number;
  maxCitations?: number;

  // Access & Type
  openAccess?: boolean;
  hasPdf?: boolean;
  docType?: DocumentType;

  // Source
  sources?: JournalSource[];

  // AI Filters
  minRelevanceScore?: number;      // 0–100
  researchMethod?: ResearchMethod;
  category?: TopicCategory;
  complexity?: ComplexityLevel;
}

export interface AIEnrichment {
  relevanceScore: number;          // 0–100: how relevant to the search query
  researchMethod: ResearchMethod;
  category: TopicCategory;
  complexity: ComplexityLevel;
  shortSummary: string;            // 2-sentence AI summary
  aiKeywords: string[];            // AI-extracted keywords
  enrichedAt: number;              // timestamp
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
  // AI Enrichment (optional, populated async)
  aiEnrichment?: AIEnrichment;
}

export interface SearchResponse {
  success: boolean;
  data: UniversalPaperEnriched[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  message?: string;
  filters?: SearchFilters;
  source?: string;
}

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
}
