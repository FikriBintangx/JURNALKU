export interface Journal {
  paperId: string;
  id?: string; // Unified ID
  title: string;
  abstract?: string;
  year?: number | null;
  authors?: { authorId?: string; name: string }[];
  url?: string;
  doi?: string;
  venue?: string;
  citationCount?: number;
  citations?: number; // Unified name
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
  };
  source?: string;
  relevanceScore?: number;
  embedding?: number[];
  keywords?: string[];
  isScraped?: boolean;
}


export interface SearchResponse {
  total: number;
  offset: number;
  data: Journal[];
}
