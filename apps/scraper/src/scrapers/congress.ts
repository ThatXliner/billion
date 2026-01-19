import { PlaywrightCrawler, Dataset } from 'crawlee';
import { upsertBill } from '../utils/db.js';

export async function scrapeCongress() {
  console.log('Starting Congress.gov scraper...');

  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Handle the browse/listing page
      if (request.url.includes('/search?q=%7B%22congress%22%3A119%2C%22chamber%22%3A%22House%22%2C%22type%22%3A%22bills%22%7D&pageSort=documentNumber%3Adesc')) {
        // Wait for the page content to load
        await page.waitForTimeout(2000);

        // Extract bill links with the correct format
        const billLinks = await page.$$eval('a[href*="/bill/"]', (links) =>
          links
            .map((link) => (link as HTMLAnchorElement).href)
            // Match the pattern: /bill/119th-congress/house-bill/NUMBER
            .filter((href) => /\/bill\/\d+(?:th|st|nd|rd)-congress\/(?:house|senate)-bill\/\d+/i.test(href))
            // Ensure we have the full congress.gov URL
            .map((href) => {
              // If it's a relative URL, make it absolute
              if (href.startsWith('/')) {
                return `https://www.congress.gov${href}`;
              }
              return href;
            })
            .slice(0, 20) // Limit to first 20 bills for testing
        );

        log.info(`Found ${billLinks.length} bill links from Congress.gov`);
        log.info(`${billLinks}`);

        // Return bill links to be processed
        await Dataset.pushData({
          type: 'congressBillLinks',
          links: [...new Set(billLinks)], // Remove duplicates
        });
      }
      // Handle individual bill pages - updated regex pattern
      else if (/\/bill\/\d+(?:th|st|nd|rd)-congress\/(?:house|senate)-bill\/\d+/i.test(request.url)) {
        try {
          // Wait for main content to load with a timeout
          await page.waitForSelector('h1, .bill-number', { timeout: 1000 }).catch(() => {
            log.warning('Main content selector not found, continuing anyway...');
          });

          // Extract bill number with timeout
          const billNumber = await page
            .locator('.bill-number, h1')
            .first()
            .textContent({ timeout: 500 })
            .then((text) => {
              const match = text?.match(/([HS]\.\s?(?:R\.|J\.\s?Res\.|Con\.\s?Res\.|Res\.)\s?\d+)/i);
              return match ? match[1]!.trim() : text?.trim().split(' ')[0] || '';
            })
            .catch(() => {
              log.warning('Could not extract bill number');
              return 'Unknown';
            });

          // Extract title with timeout
          const title = await page
            .locator('.bill-title, h1')
            .first()
            .textContent({ timeout: 500 })
            .then((text) => {
              // Remove bill number from title if present
              return text?.replace(/[HS]\.\s?(?:R\.|J\.\s?Res\.|Con\.\s?Res\.|Res\.)\s?\d+/i, '').trim() || '';
            })
            .catch(() => {
              log.warning('Could not extract title');
              return 'Unknown';
            });

          // Extract sponsor with timeout
          const sponsor = await page
            .locator('text=/Sponsor:/i')
            .locator('..')
            .textContent({ timeout: 500 })
            .then((text) => text?.replace(/Sponsor:/i, '').trim())
            .catch(() => undefined);
      

          // Extract status with timeout
          const status = await page
            .locator('.bill-status, [class*="status"]')
            .first()
            .textContent({ timeout: 500 })
            .then((text) => text?.trim())
            .catch(() => 'Unknown');

          // Extract introduced date with timeout
          const introducedDateStr = await page
            .locator('text=/Introduced:/i')
            .locator('..')
            .textContent({ timeout: 500 })
            .then((text) => text?.replace(/Introduced:/i, '').trim())
            .catch(() => undefined);

          const introducedDate = introducedDateStr ? new Date(introducedDateStr) : undefined;

          // Extract congress number from URL (more reliable with the new format)
          const congressMatch = request.url.match(/\/bill\/(\d+)(?:th|st|nd|rd)-congress/i);
          const congress = congressMatch ? parseInt(congressMatch[1]!) : undefined;

          // Extract chamber from URL (more reliable with the new format)
          const chamberMatch = request.url.match(/\/(house|senate)-bill\//i);
          const chamber = chamberMatch ? (chamberMatch[1]!.charAt(0).toUpperCase() + chamberMatch[1]!.slice(1)) : 
                         (billNumber.toLowerCase().startsWith('h.') ? 'House' : 'Senate');

          // Extract summary with timeout
          const summary = await page
            .locator('.summary, [class*="summary"]')
            .first()
            .textContent({ timeout: 5000 })
            .then((text) => text?.trim())
            .catch(() => undefined);
          console.log(summary);

          // Try to get full text with timeout
          const fullText = await page
            .locator('.bill-text, [class*="text"]')
            .first()
            .textContent({ timeout: 5000 })
            .then((text) => text?.trim())
            .catch(() => undefined);

          const billData = {
            billNumber,
            title,
            description: summary,
            sponsor,
            status,
            introducedDate,
            congress,
            chamber,
            summary,
            fullText,
            url: request.url,
            sourceWebsite: 'congress.gov',
          };

          log.info(`Scraped bill from Congress.gov: ${billNumber} - ${title}`);

          // Save to database
          // await upsertBill(billData);
        } catch (error) {
          log.error(`Error scraping bill from ${request.url}:`, error);
        }
      }
    },
    maxRequestsPerCrawl: 50, // Limit for testing
    headless: true,
    requestHandlerTimeoutSecs: 60,
  });

  // Start with the browse page
  await crawler.run(['https://www.congress.gov/search?q=%7B%22congress%22%3A119%2C%22chamber%22%3A%22House%22%2C%22type%22%3A%22bills%22%7D&pageSort=documentNumber%3Adesc']);

  // Get the bill links from the dataset
  const dataset = await Dataset.open();
  const data = await dataset.getData();
  const billLinksData = data.items.find((item: any) => item.type === 'congressBillLinks');

  if (billLinksData && Array.isArray(billLinksData.links)) {
    // Now scrape each bill page
    await crawler.run(billLinksData.links);
  }

  console.log('Congress.gov scraper completed');
}