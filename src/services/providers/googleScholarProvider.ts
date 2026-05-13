import { chromium } from 'playwright';
import type { UniversalPaperEnriched } from '@/types/search';

const GS_URL = 'https://scholar.google.com/scholar';
const TIMEOUT = 15000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * High-Performance Google Scholar Scraper using Playwright Browser Automation.
 * This simulates a real human browsing to bypass simple bot detection.
 */
export async function fetchGoogleScholar(query: string, limit: number, offset: number = 0): Promise<UniversalPaperEnriched[]> {
  console.log(`[PLAYWRIGHT GS] Searching: "${query}" (limit: ${limit}, offset: ${offset})`);
  
  const browser = await chromium.launch({
    headless: true, 
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    
    // 1. Go to Google Scholar with start parameter for pagination
    const start = offset;
    const url = `${GS_URL}?q=${encodeURIComponent(query)}&hl=en&start=${start}`;
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT,
    });

    // 2. Wait for results or captcha
    const isCaptcha = await page.isVisible('#captcha-form, .g-recaptcha');
    if (isCaptcha) {
      console.warn('[PLAYWRIGHT GS] Detected CAPTCHA. Attempting fallback or aborting.');
      await browser.close();
      return [];
    }

    // 3. Extract raw data from elements
    const rawPapers = await page.$$eval('.gs_r.gs_or.gs_scl', (elements) => {
      return elements.map((el) => {
        const titleEl = el.querySelector('.gs_rt a') as HTMLAnchorElement;
        const title = titleEl?.innerText || (el.querySelector('.gs_rt') as HTMLElement)?.innerText || 'Untitled';
        const url = titleEl?.href || '';
        
        const metaEl = el.querySelector('.gs_a') as HTMLElement;
        const metaText = metaEl?.innerText || '';
        
        const snippetEl = el.querySelector('.gs_rs') as HTMLElement;
        const abstract = snippetEl?.innerText || '';
        
        const footerLinks = Array.from(el.querySelectorAll('.gs_fl a'));
        const citeLink = footerLinks.find(a => a.textContent?.includes('Cited by'));
        const citations = citeLink ? parseInt(citeLink.textContent?.match(/\d+/)?.[0] || '0') : 0;
        
        const pdfEl = el.querySelector('.gs_or_ggsm a') as HTMLAnchorElement;
        const pdfUrl = pdfEl?.href || '';

        return { title, url, metaText, abstract, citations, pdfUrl };
      });
    });

    await browser.close();

    // 4. Map to enriched type (outside browser context to use Node globals)
    const papers: UniversalPaperEnriched[] = rawPapers.map(p => {
      const metaParts = p.metaText.split(' - ');
      const authors = metaParts[0]?.split(',').map(name => ({ name: name.trim() })) || [];
      const yearMatch = p.metaText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() - 5;
      const venue = metaParts[1] || '';

      return {
        id: `gs-${Math.random().toString(36).substr(2, 9)}`,
        paperId: `gs-${Buffer.from(p.title.slice(0, 20)).toString('base64')}`,
        title: p.title,
        abstract: p.abstract,
        authors,
        year,
        citations: p.citations,
        doi: '',
        source: 'googlescholar',
        isOpenAccess: !!p.pdfUrl,
        pdfUrl: p.pdfUrl,
        url: p.url,
        externalUrl: p.url,
        venue,
        keywords: [],
        docType: 'journal_article',
        relevanceScore: 0,
      };
    });

    // 4. Smart Retry if 0 results
    if (papers.length === 0 && query.split(' ').length > 5) {
      const simpleQuery = query.split(' ').slice(0, 5).join(' ');
      console.log(`[PLAYWRIGHT GS] No results for long query. Retrying with simple: "${simpleQuery}"`);
      return await fetchGoogleScholar(simpleQuery, limit);
    }

    return papers.slice(0, limit);

  } catch (error: any) {
    console.error(`[PLAYWRIGHT GS] Error: ${error.message}`);
    if (browser) await browser.close();
    return [];
  }
}
