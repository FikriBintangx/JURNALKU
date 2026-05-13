import { NextResponse } from 'next/server';
import { searchAggregator } from '@/services/searchAggregator';
import { embeddingService } from '@/services/embeddingService';
import { rankingEngine } from '@/services/rankingEngine';
import { aiEnrichmentService } from '@/services/aiEnrichmentService';
import type { SearchFilters, UniversalPaperEnriched } from '@/types/search';

/**
 * JurnalStar Smart Search API
 *
 * Features:
 * - Multi-source parallel search (OpenAlex + Semantic Scholar + Crossref + CORE)
 * - Server-side filtering (year, citations, source, openAccess, docType)
 * - AI enrichment (relevance score, research method, category, complexity)
 * - Semantic embedding ranking with keyword fallback
 * - Redis cache for repeat queries
 * - Zero 500 errors — always returns 200 with data or graceful empty state
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // ─── Parse params ─────────────────────────────────────────
  const rawQuery = searchParams.get('q') || searchParams.get('query') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(20, Math.max(5, parseInt(searchParams.get('limit') || '15')));
  const enrich = searchParams.get('enrich') === 'true'; // opt-in AI enrichment
  const provider = searchParams.get('provider') || 'default';

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

  // ─── Validate query ───────────────────────────────────────
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
    console.log(`[SEARCH API] Query: "${query}", Filters:`, JSON.stringify(filters));

    // ─── 1. Multi-source fetch ────────────────────────────────
    const fetchLimit = pageSize * 3; // Over-fetch to allow for filtering
    const { results: rawPapers, intelligence: queryIntel } = await searchAggregator.search(query, fetchLimit, filters, provider);

    if (!rawPapers || rawPapers.length === 0) {
      return NextResponse.json({
        success: true, data: [], total: 0,
        page, pageSize, hasMore: false,
        message: "Tidak ada hasil untuk pencarian ini. Coba kata kunci yang berbeda.",
      });
    }

    console.log(`[SEARCH API] Raw results: ${rawPapers.length} papers`);

    // ─── 2. Semantic embedding (optional, non-blocking) ───────
    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await embeddingService.getEmbedding(query);
    } catch {
      console.warn("[SEARCH API] Embedding skipped — using keyword ranking.");
    }

    // ─── 3. Score with ranking engine ────────────────────────
    const ranked = rankingEngine.calculateScores(rawPapers as any, queryEmbedding, query) as UniversalPaperEnriched[];

    // ─── 4. AI Enrichment (opt-in, top 10 only to save quota) ─
    let enrichmentMap = new Map<string, any>();
    if (enrich && ranked.length > 0) {
      const topPapers = ranked.slice(0, 10).map(p => ({
        id: p.id,
        paperId: p.paperId || p.id,
        title: p.title || '',
        abstract: p.abstract || '',
      }));
      enrichmentMap = await aiEnrichmentService.enrichBatch(topPapers, query, 3);
      console.log(`[SEARCH API] Enriched ${enrichmentMap.size} papers`);
    }

    // ─── 5. Attach enrichment data ────────────────────────────
    const enriched: UniversalPaperEnriched[] = ranked.map(paper => {
      const paperId = paper.paperId || paper.id;
      const enrichmentData = enrichmentMap.get(paperId);
      return {
        ...paper,
        paperId,
        docType: (paper as any).docType || 'unknown',
        isOpenAccess: (paper as any).isOpenAccess || false,
        aiEnrichment: enrichmentData || undefined,
        // AI relevance score overrides keyword score if available
        relevanceScore: enrichmentData?.relevanceScore ?? paper.relevanceScore,
      };
    });

    // ─── 6. Server-side filtering ─────────────────────────────
    const filtered = applyFilters(enriched, filters);
    console.log(`[SEARCH API] After filtering: ${filtered.length}/${enriched.length} papers`);

    // ─── 7. Sort ──────────────────────────────────────────────
    const sorted = applySorting(filtered, filters.sortBy || 'relevance');

    // ─── 8. Paginate ──────────────────────────────────────────
    const total = sorted.length;
    const offset = (page - 1) * pageSize;
    const paginated = sorted.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < total;

    console.log(`[SEARCH API] Done in ${Date.now() - startTime}ms — returning ${paginated.length}/${total} papers`);

    return NextResponse.json({
      success: true, error: false,
      data: paginated,
      total,
      page,
      pageSize,
      hasMore,
      message: `${total} karya ilmiah ditemukan.`,
      enriched: enrich,
      intelligence: queryIntel,
    });

  } catch (error: any) {
    console.error('[SEARCH API] Critical error:', error.message);
    return NextResponse.json({
      success: false, error: true,
      message: "Mesin pencari mengalami gangguan teknis. Mohon coba kembali.",
      data: [], total: 0, page, pageSize, hasMore: false,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// FILTER ENGINE — all server-side
// ─────────────────────────────────────────────────────────────

function applyFilters(papers: UniversalPaperEnriched[], filters: SearchFilters): UniversalPaperEnriched[] {
  return papers.filter(paper => {
    // Year range
    if (filters.yearStart && paper.year && paper.year < filters.yearStart) return false;
    if (filters.yearEnd && paper.year && paper.year > filters.yearEnd) return false;

    // Citations
    if (filters.minCitations !== undefined && (paper.citations || 0) < filters.minCitations) return false;

    // Open Access
    if (filters.openAccess === true && !paper.isOpenAccess) return false;

    // Has PDF
    if (filters.hasPdf === true && !paper.pdfUrl) return false;

    // Source filter
    if (filters.sources && filters.sources.length > 0 && !filters.sources.includes('all' as any)) {
      const paperSource = (paper.source || '').toLowerCase();
      const matches = filters.sources.some(s => paperSource.includes(s.toLowerCase()));
      if (!matches) return false;
    }

    // Document type
    if (filters.docType && paper.docType && filters.docType !== 'unknown') {
      if (paper.docType !== filters.docType) return false;
    }

    // AI Relevance Score (only if enrichment available)
    if (filters.minRelevanceScore !== undefined && paper.aiEnrichment) {
      if (paper.aiEnrichment.relevanceScore < filters.minRelevanceScore) return false;
    }

    // Research Method (AI filter)
    if (filters.researchMethod && paper.aiEnrichment) {
      if (paper.aiEnrichment.researchMethod !== filters.researchMethod) return false;
    }

    // Topic Category (AI filter)
    if (filters.category && paper.aiEnrichment) {
      if (paper.aiEnrichment.category !== filters.category) return false;
    }

    // Complexity (AI filter)
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
