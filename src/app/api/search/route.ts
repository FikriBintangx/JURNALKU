import { NextResponse } from 'next/server';
import { searchAggregator } from '@/services/searchAggregator';
import { embeddingService } from '@/services/embeddingService';
import { rankingEngine } from '@/services/rankingEngine';
import { aiEnrichmentService } from '@/services/aiEnrichmentService';
import type { SearchFilters, UniversalPaperEnriched } from '@/types/search';

/**
 * JurnalStar Smart Search API
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawQuery = searchParams.get('q') || searchParams.get('query') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(20, Math.max(5, parseInt(searchParams.get('limit') || '15')));
  const enrich = searchParams.get('enrich') === 'true';

  const filters: SearchFilters = {
    yearStart: searchParams.get('yearStart') ? parseInt(searchParams.get('yearStart')!) : undefined,
    yearEnd: searchParams.get('yearEnd') ? parseInt(searchParams.get('yearEnd')!) : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'relevance',
    minCitations: searchParams.get('minCitations') ? parseInt(searchParams.get('minCitations')!) : undefined,
    openAccess: searchParams.get('openAccess') === 'true' ? true : undefined,
    hasPdf: searchParams.get('hasPdf') === 'true' ? true : undefined,
    sources: searchParams.get('sources')?.split(',').filter(Boolean) as any || undefined,
    minRelevanceScore: searchParams.get('minRelevanceScore') ? parseInt(searchParams.get('minRelevanceScore')!) : undefined,
    researchMethod: searchParams.get('researchMethod') as any || undefined,
    category: searchParams.get('category') as any || undefined,
    complexity: searchParams.get('complexity') as any || undefined,
  };

  const query = searchAggregator.sanitizeQuery(rawQuery);
  if (!query) {
    return NextResponse.json({
      success: false, error: true,
      message: "Query pencarian diperlukan.",
      data: [], total: 0, page: 1, pageSize, hasMore: false,
    });
  }

  try {
    const startTime = Date.now();
    const fetchLimit = pageSize * 3;
    const rawPapers = await searchAggregator.search(query, fetchLimit);

    if (!rawPapers || rawPapers.length === 0) {
      return NextResponse.json({
        success: true, data: [], total: 0,
        page, pageSize, hasMore: false,
        message: "Tidak ada hasil untuk pencarian ini.",
      });
    }

    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await embeddingService.getEmbedding(query);
    } catch {}

    const ranked = rankingEngine.calculateScores(rawPapers as any, queryEmbedding, query) as UniversalPaperEnriched[];

    let enrichmentMap = new Map<string, any>();
    if (enrich && ranked.length > 0) {
      const topPapers = ranked.slice(0, 10).map(p => ({
        id: p.id,
        paperId: p.paperId || p.id,
        title: p.title || '',
        abstract: p.abstract || '',
      }));
      enrichmentMap = await aiEnrichmentService.enrichBatch(topPapers, query, 3);
    }

    const enriched: UniversalPaperEnriched[] = ranked.map(paper => {
      const paperId = paper.paperId || paper.id;
      const enrichmentData = enrichmentMap.get(paperId);
      return {
        ...paper,
        paperId,
        docType: (paper as any).docType || 'unknown',
        isOpenAccess: (paper as any).isOpenAccess || false,
        aiEnrichment: enrichmentData || undefined,
        relevanceScore: enrichmentData?.relevanceScore ?? paper.relevanceScore,
      };
    });

    const filtered = applyFilters(enriched, filters);
    const sorted = applySorting(filtered, filters.sortBy || 'relevance');

    const total = sorted.length;
    const offset = (page - 1) * pageSize;
    const paginated = sorted.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < total;

    return NextResponse.json({
      success: true, error: false,
      data: paginated,
      total,
      page,
      pageSize,
      hasMore,
      message: `${total} karya ilmiah ditemukan.`,
      enriched: enrich,
    });

  } catch (error: any) {
    console.error('[SEARCH API] Critical error:', error.message);
    return NextResponse.json({
      success: false, error: true,
      message: "Mesin pencari mengalami gangguan teknis.",
      data: [], total: 0, page, pageSize, hasMore: false,
    });
  }
}

function applyFilters(papers: UniversalPaperEnriched[], filters: SearchFilters): UniversalPaperEnriched[] {
  return papers.filter(paper => {
    if (filters.yearStart && paper.year && paper.year < filters.yearStart) return false;
    if (filters.yearEnd && paper.year && paper.year > filters.yearEnd) return false;
    if (filters.minCitations !== undefined && (paper.citations || 0) < filters.minCitations) return false;
    if (filters.openAccess === true && !paper.isOpenAccess) return false;
    if (filters.hasPdf === true && !paper.pdfUrl) return false;
    if (filters.sources && filters.sources.length > 0 && !filters.sources.includes('all' as any)) {
      const paperSource = (paper.source || '').toLowerCase();
      const matches = filters.sources.some(s => paperSource.includes(s.toLowerCase()));
      if (!matches) return false;
    }
    if (filters.docType && paper.docType && filters.docType !== 'unknown') {
      if (paper.docType !== filters.docType) return false;
    }
    if (filters.minRelevanceScore !== undefined && paper.aiEnrichment) {
      if (paper.aiEnrichment.relevanceScore < filters.minRelevanceScore) return false;
    }
    if (filters.researchMethod && paper.aiEnrichment) {
      if (paper.aiEnrichment.researchMethod !== filters.researchMethod) return false;
    }
    if (filters.category && paper.aiEnrichment) {
      if (paper.aiEnrichment.category !== filters.category) return false;
    }
    if (filters.complexity && paper.aiEnrichment) {
      if (paper.aiEnrichment.complexity !== filters.complexity) return false;
    }
    return true;
  });
}

function applySorting(papers: UniversalPaperEnriched[], sortBy: string): UniversalPaperEnriched[] {
  const sorted = [...papers];
  switch (sortBy) {
    case 'year':
    case 'year_desc':
      return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    case 'year_asc':
      return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
    case 'citations':
    case 'citations_desc':
      return sorted.sort((a, b) => (b.citations || 0) - (a.citations || 0));
    case 'citations_asc':
      return sorted.sort((a, b) => (a.citations || 0) - (b.citations || 0));
    case 'relevance':
    default:
      return sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }
}
