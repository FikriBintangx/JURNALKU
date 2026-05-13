import axios from 'axios';
import * as cheerio from 'cheerio';
import type { UniversalPaperEnriched } from '@/types/search';

const GS_URL = 'https://scholar.google.com/scholar';
const TIMEOUT = 15000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * Lightweight Google Scholar Scraper using Axios and Cheerio.
 * Compatible with Vercel Edge and Serverless Functions (no Playwright binary dependencies).
 */
export async function fetchGoogleScholar(query: string, limit: number, offset: number = 0): Promise<UniversalPaperEnriched[]> {
  console.log(`[CHEERIO GS] Searching: "${query}" (limit: ${limit}, offset: ${offset})`);
  
  try {
    const start = offset;
    const url = `${GS_URL}?q=${encodeURIComponent(query)}&hl=en&start=${start}`;
    
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const papers: UniversalPaperEnriched[] = [];

    // Check for CAPTCHA
    if ($('#captcha-form').length > 0 || $('.g-recaptcha').length > 0) {
      console.warn('[CHEERIO GS] Detected CAPTCHA. Aborting request.');
      return [];
    }

    $('.gs_r.gs_or.gs_scl').each((_, el) => {
      const titleEl = $(el).find('.gs_rt a');
      let title = titleEl.text().trim();
      if (!title) {
        title = $(el).find('.gs_rt').text().replace(/\[.*?\]/g, '').trim() || 'Untitled';
      }
      const url = titleEl.attr('href') || '';
      
      const metaText = $(el).find('.gs_a').text() || '';
      const abstract = $(el).find('.gs_rs').text() || '';
      
      const footerLinks = $(el).find('.gs_fl a');
      let citations = 0;
      footerLinks.each((_, footerEl) => {
        const text = $(footerEl).text();
        if (text.includes('Cited by')) {
          const match = text.match(/\d+/);
          if (match) citations = parseInt(match[0]);
        }
      });
      
      const pdfUrl = $(el).find('.gs_or_ggsm a').attr('href') || '';

      const metaParts = metaText.split(' - ');
      const authors = metaParts[0]?.split(',').map(name => ({ name: name.trim() })) || [];
      const yearMatch = metaText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() - 5;
      const venue = metaParts[1] || '';

      papers.push({
        id: `gs-${Math.random().toString(36).substr(2, 9)}`,
        paperId: `gs-${Buffer.from(title.slice(0, 20)).toString('base64')}`,
        title,
        abstract,
        authors,
        year,
        citations,
        doi: '',
        source: 'googlescholar',
        isOpenAccess: !!pdfUrl,
        pdfUrl,
        url,
        externalUrl: url,
        venue,
        keywords: [],
        docType: 'journal_article',
        relevanceScore: 0,
      });
    });

    // Smart Retry if 0 results
    if (papers.length === 0 && query.split(' ').length > 5) {
      const simpleQuery = query.split(' ').slice(0, 5).join(' ');
      console.log(`[CHEERIO GS] No results for long query. Retrying with simple: "${simpleQuery}"`);
      return await fetchGoogleScholar(simpleQuery, limit, offset);
    }

    return papers.slice(0, limit);

  } catch (error: any) {
    console.error(`[CHEERIO GS] Error: ${error.message}`);
    return [];
  }
}
