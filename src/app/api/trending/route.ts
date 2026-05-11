import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Static fallback trending topics — shown when DB is empty or unavailable
const FALLBACK_TRENDING = [
  { id: 'trend-1', title: 'Large Language Models in Scientific Research', year: 2024, citations: 1250, source: 'openalex', venue: 'Nature Machine Intelligence' },
  { id: 'trend-2', title: 'AI-Assisted Drug Discovery: A Systematic Review', year: 2024, citations: 980, source: 'semantic', venue: 'Journal of Chemical Information' },
  { id: 'trend-3', title: 'Climate Change Mitigation Strategies: Meta-Analysis', year: 2023, citations: 875, source: 'crossref', venue: 'Environmental Science & Policy' },
  { id: 'trend-4', title: 'Deep Learning for Medical Image Segmentation', year: 2024, citations: 1102, source: 'openalex', venue: 'IEEE Transactions on Medical Imaging' },
  { id: 'trend-5', title: 'Quantum Computing Applications in Cryptography', year: 2023, citations: 643, source: 'crossref', venue: 'Communications of the ACM' },
  { id: 'trend-6', title: 'Sustainable Supply Chain Management: A Literature Review', year: 2024, citations: 712, source: 'semantic', venue: 'International Journal of Production Economics' },
];

export async function GET() {
  try {
    // Attempt to fetch from database
    let trending: any[] = [];

    try {
      trending = await prisma.journal.findMany({
        where: {
          year: { gte: new Date().getFullYear() - 3 }
        },
        orderBy: [
          { citations: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10,
        select: {
          id: true,
          title: true,
          year: true,
          citations: true,
          source: true,
          venue: true,
        }
      });
    } catch (dbError: any) {
      console.warn("[TRENDING] DB query failed (non-critical):", dbError.message);
      // DB failure is non-critical — use fallback
    }

    // Use fallback if DB returned nothing
    const data = (trending && trending.length > 0) ? trending : FALLBACK_TRENDING;

    console.log(`[TRENDING] Returning ${data.length} items (${trending.length > 0 ? 'from DB' : 'fallback'})`);

    return NextResponse.json({
      success: true,
      data,
      source: trending.length > 0 ? 'database' : 'fallback',
    });

  } catch (error: any) {
    console.error("[TRENDING] Unexpected error:", error.message);

    // Anti-500: always return 200 with fallback data
    return NextResponse.json({
      success: true,
      data: FALLBACK_TRENDING,
      source: 'fallback',
    });
  }
}
