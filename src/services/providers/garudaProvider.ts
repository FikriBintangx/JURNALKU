import axios from 'axios';
import * as cheerio from 'cheerio';
import type { UniversalPaperEnriched } from '@/types/search';

/**
 * Garuda (Garba Rujukan Digital) Provider.
 * The official Indonesian national research portal.
 * Vital for Indonesian-specific queries.
 */
export async function fetchGaruda(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  try {
    const searchUrl = `https://garuda.kemdikbud.go.id/documents?q=${encodeURIComponent(query)}`;
    
    const res = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const papers: UniversalPaperEnriched[] = [];

    $('.article-item').each((i, el) => {
      if (i >= limit) return;

      const title = $(el).find('.title-article').text().trim();
      const url = 'https://garuda.kemdikbud.go.id' + $(el).find('.title-article').attr('href');
      const abstract = $(el).find('.abstract-article').text().trim();
      const venue = $(el).find('.publisher-info').text().trim();
      
      // Extract year from text like "Vol 5, No 2 (2023)"
      const yearMatch = venue.match(/\((\d{4})\)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

      const authorsRaw = $(el).find('.author-article').text().trim();
      const authors = authorsRaw.split(',').map(name => ({ name: name.trim() }));

      const pdfUrl = $(el).find('a:contains("Download")').attr('href') || '';

      papers.push({
        id: `garuda-${Math.random().toString(36).substr(2, 9)}`,
        paperId: url,
        title: title || 'Untitled',
        abstract: abstract || '',
        authors: authors.length > 0 ? authors : [{ name: 'Unknown' }],
        year,
        citations: 0,
        doi: '',
        source: 'garuda',
        isOpenAccess: true,
        pdfUrl: pdfUrl.startsWith('http') ? pdfUrl : pdfUrl ? 'https://garuda.kemdikbud.go.id' + pdfUrl : '',
        url: url,
        externalUrl: url,
        venue: venue,
        keywords: [],
        docType: 'journal_article',
        relevanceScore: 0
      });
    });

    return papers;
  } catch (error: any) {
    console.error(`[PROVIDER] Garuda error: ${error.message}`);
    return [];
  }
}
