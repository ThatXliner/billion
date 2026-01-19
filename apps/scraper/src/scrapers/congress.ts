import { PlaywrightCrawler, Dataset } from 'crawlee';
import { upsertBill, resetMetrics, printMetricsSummary } from '../utils/db.js';

export async function scrapeCongress() {
  console.log('Starting Congress.gov scraper...');

  // Reset metrics for this scraper run
  resetMetrics();

  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Handle the browse/listing page
      if (request.url.includes('/browse')) {
        // Wait for the page content to load
        await page.waitForTimeout(2000);

        // Extract bill links
        const billLinks = await page.$$eval('a[href*="/bill/"]', (links) =>
          links
            .map((link) => (link as HTMLAnchorElement).href)
            .filter((href) => /\/bill\/\d+/.test(href))
            .slice(0, 20) // Limit to first 20 bills for testing
        );

        log.info(`Found ${billLinks.length} bill links from Congress.gov`);

        // Return bill links to be processed
        await Dataset.pushData({
          type: 'congressBillLinks',
          links: [...new Set(billLinks)], // Remove duplicates
        });
      }
      // Handle individual bill pages
      else if (/\/bill\/\d+/.test(request.url)) {
        try {
          // Wait for content to load
          await page.waitForTimeout(1000);

          // Extract bill number
          const billNumber = await page
            .locator('.bill-number, h1')
            .first()
            .textContent()
            .then((text) => {
              const match = text?.match(/([HS]\.\s?(?:R\.|J\.\s?Res\.|Con\.\s?Res\.|Res\.)\s?\d+)/i);
              return match ? match[1]!.trim() : text?.trim().split(' ')[0] || '';
            });

          // Extract title
          const title = await page
            .locator('.bill-title, h1')
            .first()
            .textContent()
            .then((text) => {
              // Remove bill number from title if present
              return text?.replace(/[HS]\.\s?(?:R\.|J\.\s?Res\.|Con\.\s?Res\.|Res\.)\s?\d+/i, '').trim() || '';
            });

          // Extract sponsor
          const sponsor = await page
            .locator('text=/Sponsor:/i')
            .locator('..')
            .textContent()
            .then((text) => text?.replace(/Sponsor:/i, '').trim())
            .catch(() => undefined);

          // Extract status
          const status = await page
            .locator('.bill-status, [class*="status"]')
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => 'Unknown');

          // Extract introduced date
          const introducedDateStr = await page
            .locator('text=/Introduced:/i')
            .locator('..')
            .textContent()
            .then((text) => text?.replace(/Introduced:/i, '').trim())
            .catch(() => undefined);

          const introducedDate = introducedDateStr ? new Date(introducedDateStr) : undefined;

          // Extract congress number from URL or page
          const congressMatch = request.url.match(/\/(\d+)(?:th|st|nd|rd)?-congress/i) ||
                               await page.textContent('body').then(text => text?.match(/(\d+)(?:th|st|nd|rd)\s+Congress/i));
          const congress = congressMatch ? parseInt(congressMatch[1]!) : undefined;

          // Extract chamber from bill number
          const chamber = billNumber.toLowerCase().startsWith('h.') ? 'House' : 'Senate';

          // Extract summary
          const summary = await page
            .locator('.summary, [class*="summary"]')
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => undefined);

          // Try to get full text
          const fullText = await page
            .locator('.bill-text, [class*="text"]')
            .first()
            .textContent()
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
          await upsertBill(billData);
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
  await crawler.run(['https://www.congress.gov/browse']);

  // Get the bill links from the dataset
  const dataset = await Dataset.open();
  const data = await dataset.getData();
  const billLinksData = data.items.find((item: any) => item.type === 'congressBillLinks');

  if (billLinksData && Array.isArray(billLinksData.links)) {
    // Now scrape each bill page
    await crawler.run(billLinksData.links);
  }

  console.log('Congress.gov scraper completed');

  // Print metrics summary
  printMetricsSummary("Congress.gov");
}
