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
export async function fetchGoogleScholar(query: string, limit: number): Promise<UniversalPaperEnriched[]> {
  console.log(`[PLAYWRIGHT GS] Searching: "${query}" (limit: ${limit})`);
  
  const browser = await chromium.launch({
    headless: true, // Set to false to see the bot in action during local dev
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    
    // 1. Go to Google Scholar with a small random delay
    await page.goto(`${GS_URL}?q=${encodeURIComponent(query)}&hl=en`, {
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

    // 3. Extract results
    const papers: UniversalPaperEnriched[] = await page.$$eval('.gs_r.gs_or.gs_scl', (elements) => {
      return elements.map((el) => {
        const titleEl = el.querySelector('.gs_rt a') as HTMLAnchorElement;
        const title = titleEl?.innerText || (el.querySelector('.gs_rt') as HTMLElement)?.innerText || 'Untitled';
        const url = titleEl?.href || '';
        
        const metaEl = el.querySelector('.gs_a') as HTMLElement;
        const metaText = metaEl?.innerText || '';
        const metaParts = metaText.split(' - ');
        const authors = metaParts[0]?.split(',').map(name => ({ name: name.trim() })) || [];
        
        // Extract year from meta text (e.g., "J Smith - Nature, 2023 - nature.com")
        const yearMatch = metaText.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() - 5;
        
        const snippetEl = el.querySelector('.gs_rs') as HTMLElement;
        const abstract = snippetEl?.innerText || '';
        
        const citeEl = el.querySelector('.gs_fl a:contains("Cited by")') || 
                       Array.from(el.querySelectorAll('.gs_fl a')).find(a => a.textContent?.includes('Cited by'));
        const citations = citeEl ? parseInt(citeEl.textContent?.match(/\d+/)?.[0] || '0') : 0;
        
        const pdfEl = el.querySelector('.gs_or_ggsm a') as HTMLAnchorElement;
        const pdfUrl = pdfEl?.href || '';

        const venue = metaParts[1] || '';

        return {
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
        };
      });
    });

    await browser.close();

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
