/**
 * ISAGI — Source Validator
 * ========================
 * Trust & Validation Layer.
 * 
 * Responsibilities:
 * - Validate academic source quality
 * - Detect misinformation signals
 * - Cross-reference claims
 * - Assign trust tiers (Tier 1 = gold standard)
 * - Flag retracted or low-quality papers
 */

import { UniversalPaperEnriched } from '@/types/search';
import { SourceValidation, SourceTrustTier } from './types';

// ── High-Reputation Venue Databases ───────────────────────────────────────

const TIER1_VENUES = [
  'nature', 'science', 'cell', 'lancet', 'nejm', 'jama', 'pnas',
  'ieee transactions', 'acm', 'springer', 'elsevier',
  'journal of the american', 'annual review',
  'physical review', 'chemical society', 'plos',
];

const TIER2_VENUES = [
  'frontiers', 'mdpi', 'wiley', 'sage', 'taylor & francis',
  'oxford university press', 'cambridge university press',
  'emerald', 'hindawi', 'journal of',
];

const PREDATORY_SIGNALS = [
  'quick publication', 'rapid review', 'immediate acceptance',
  'waived fees', 'predatory', 'beall',
];

// ── Trust Score Weights ────────────────────────────────────────────────────
// Total: 100 points

const WEIGHTS = {
  hasDOI:            15,
  isPeerReviewed:    20,
  highCitations:     20,  // >50 citations
  recentPublication: 10,  // within 5 years
  topVenue:          20,  // Tier 1 venue
  goodVenue:         10,  // Tier 2 venue
  hasAbstract:        5,
  isOpenAccess:       5,  // bonus for accessibility
  negRetracted:     -40,  // penalty
  negPredatory:     -30,  // penalty
};

export const ISAGIValidator = {

  // ── Primary Validation Entry Point ────────────────────────────────────────

  validateSource(paper: UniversalPaperEnriched): SourceValidation {
    const flags: string[] = [];
    let trustScore = 0;
    const currentYear = new Date().getFullYear();

    // 1. DOI (unique academic identifier = verified publication)
    const hasDOI = !!(paper.doi && paper.doi.trim().length > 5);
    if (hasDOI) trustScore += WEIGHTS.hasDOI;
    else flags.push('no_doi');

    // 2. Peer-review heuristic (conferences, journals → peer-reviewed; preprints → no)
    const source = (paper.source || '').toLowerCase();
    const isPeerReviewed = !['zenodo', 'arxiv', 'preprint'].includes(source);
    if (isPeerReviewed) trustScore += WEIGHTS.isPeerReviewed;
    else flags.push('preprint_or_unreviewed');

    // 3. Citation count
    const citations = paper.citations || 0;
    const hasHighCitations = citations >= 50;
    const hasMediumCitations = citations >= 10;
    if (hasHighCitations) trustScore += WEIGHTS.highCitations;
    else if (hasMediumCitations) trustScore += WEIGHTS.highCitations / 2;
    else if (citations > 0) trustScore += 5;

    // 4. Recency
    const age = Math.max(0, currentYear - (paper.year || currentYear));
    const isRecentlyPublished = age <= 5;
    if (isRecentlyPublished) trustScore += WEIGHTS.recentPublication;
    else if (age <= 10) trustScore += WEIGHTS.recentPublication / 2;

    // 5. Venue reputation
    const venueLower = (paper.venue || '').toLowerCase();
    const isTier1 = TIER1_VENUES.some(v => venueLower.includes(v));
    const isTier2 = !isTier1 && TIER2_VENUES.some(v => venueLower.includes(v));
    let venueReputation: 'top' | 'good' | 'average' | 'unknown' = 'unknown';

    if (isTier1) {
      trustScore += WEIGHTS.topVenue;
      venueReputation = 'top';
    } else if (isTier2) {
      trustScore += WEIGHTS.goodVenue;
      venueReputation = 'good';
    } else if (venueLower.length > 3) {
      trustScore += 5;
      venueReputation = 'average';
    }

    // 6. Content quality
    if (paper.abstract && paper.abstract.length > 100) trustScore += WEIGHTS.hasAbstract;
    if (paper.isOpenAccess) trustScore += WEIGHTS.isOpenAccess;

    // 7. Negative signals
    const titleLower = (paper.title || '').toLowerCase();
    const abstractLower = (paper.abstract || '').toLowerCase();
    const fullText = `${titleLower} ${abstractLower}`;

    if (fullText.includes('[retracted]') || titleLower.includes('retraction')) {
      trustScore += WEIGHTS.negRetracted;
      flags.push('retracted');
    }

    if (PREDATORY_SIGNALS.some(s => fullText.includes(s))) {
      trustScore += WEIGHTS.negPredatory;
      flags.push('predatory_signals');
    }

    // Clamp score
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

    // Determine tier
    const trustTier: SourceTrustTier =
      trustScore >= 80 ? 'tier_1' :
      trustScore >= 55 ? 'tier_2' :
      trustScore >= 30 ? 'tier_3' : 'unverified';

    return {
      paperId: paper.paperId || paper.id,
      trustTier,
      trustScore,
      hasDOI,
      isPeerReviewed,
      hasHighCitations,
      isRecentlyPublished,
      venue: paper.venue || 'Unknown',
      venueReputation,
      flags,
    };
  },

  // ── Batch Validation ──────────────────────────────────────────────────────

  validateBatch(papers: UniversalPaperEnriched[]): SourceValidation[] {
    return papers.map(p => this.validateSource(p));
  },

  // ── Filter by Trust Tier ──────────────────────────────────────────────────

  filterByTrust(
    papers: UniversalPaperEnriched[],
    validations: SourceValidation[],
    minTier: SourceTrustTier = 'tier_3'
  ): UniversalPaperEnriched[] {
    const tierRank = { tier_1: 4, tier_2: 3, tier_3: 2, unverified: 1 };
    const minRank = tierRank[minTier];

    const trustedIds = new Set(
      validations
        .filter(v => tierRank[v.trustTier] >= minRank && !v.flags.includes('retracted'))
        .map(v => v.paperId)
    );

    return papers.filter(p => trustedIds.has(p.paperId || p.id));
  },

  // ── Average Trust Score ───────────────────────────────────────────────────

  averageTrustScore(validations: SourceValidation[]): number {
    if (validations.length === 0) return 0;
    return Math.round(validations.reduce((sum, v) => sum + v.trustScore, 0) / validations.length);
  },

  // ── Detect Conflicting Claims ─────────────────────────────────────────────

  detectConflicts(papers: UniversalPaperEnriched[]): Array<{ ids: string[]; signal: string }> {
    const conflicts: Array<{ ids: string[]; signal: string }> = [];

    // Simple pattern: papers with opposite stance keywords in abstracts
    const POSITIVE_SIGNALS = ['significant positive', 'significantly improved', 'enhances', 'increases', 'positive effect'];
    const NEGATIVE_SIGNALS = ['no significant', 'no effect', 'did not improve', 'negative effect', 'decreases'];

    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const absI = (papers[i].abstract || '').toLowerCase();
        const absJ = (papers[j].abstract || '').toLowerCase();

        const posI = POSITIVE_SIGNALS.some(s => absI.includes(s));
        const negJ = NEGATIVE_SIGNALS.some(s => absJ.includes(s));
        const negI = NEGATIVE_SIGNALS.some(s => absI.includes(s));
        const posJ = POSITIVE_SIGNALS.some(s => absJ.includes(s));

        if ((posI && negJ) || (negI && posJ)) {
          conflicts.push({
            ids: [papers[i].paperId || papers[i].id, papers[j].paperId || papers[j].id],
            signal: 'Contradictory conclusions detected in abstract analysis',
          });
        }
      }
    }

    return conflicts.slice(0, 5); // Return max 5 conflicts
  },

  // ── Source Ranking by Trust + Relevance ───────────────────────────────────

  rankByTrustAndRelevance(
    papers: UniversalPaperEnriched[],
    validations: SourceValidation[]
  ): UniversalPaperEnriched[] {
    const trustMap = new Map<string, number>();
    for (const v of validations) {
      trustMap.set(v.paperId, v.trustScore);
    }

    return [...papers].sort((a, b) => {
      const trustA = trustMap.get(a.paperId || a.id) || 0;
      const trustB = trustMap.get(b.paperId || b.id) || 0;
      const relevA = a.relevanceScore || 0;
      const relevB = b.relevanceScore || 0;
      // Weighted composite: 60% relevance, 40% trust
      return (relevB * 0.6 + trustB * 0.4) - (relevA * 0.6 + trustA * 0.4);
    });
  },
};
