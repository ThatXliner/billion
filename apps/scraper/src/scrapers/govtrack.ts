import { PlaywrightCrawler, Dataset } from 'crawlee';
import { upsertBill } from '../utils/db.js';

export async function scrapeGovTrack() {
  console.log('Starting GovTrack scraper...');

  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Handle the main listing page
      if (request.url.includes('/congress/bills')) {
        // Extract bill links from the status page
        const billLinks = await page.$$eval('a[href*="/congress/bills/"]', (links) =>
          links
            .map((link) => (link as HTMLAnchorElement).href)
            .filter((href) => /\/congress\/bills\/\d+\/[a-z]+\d+/.test(href))
            .slice(0, 20) // Limit to first 20 bills for testing
        );

        log.info(`Found ${billLinks.length} bill links`);

        // Return bill links to be processed
        await Dataset.pushData({
          type: 'billLinks',
          links: billLinks,
        });
      }
      // Handle individual bill pages
      else if (/\/congress\/bills\/\d+\/[a-z]+\d+/.test(request.url)) {
        try {
          // Extract bill information
          const billNumber = await page
            .locator('h1')
            .first()
            .textContent()
            .then((text) => text?.trim().split(':')[0]?.trim() || '');

          const title = await page
            .locator('h1')
            .first()
            .textContent()
            .then((text) => {
              const parts = text?.trim().split(':');
              return parts && parts.length > 1 ? parts.slice(1).join(':').trim() : text?.trim() || '';
            });

          // Extract sponsor
          const sponsor = await page
            .locator('text=Sponsor:')
            .locator('..')
            .textContent()
            .then((text) => text?.replace('Sponsor:', '').trim())
            .catch(() => undefined);

          // Extract status
          const status = await page
            .locator('.bill-status')
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => 'Unknown');

          // Extract introduced date
          const introducedDateStr = await page
            .locator('text=Introduced:')
            .locator('..')
            .textContent()
            .then((text) => text?.replace('Introduced:', '').trim())
            .catch(() => undefined);

          const introducedDate = introducedDateStr ? new Date(introducedDateStr) : undefined;

          // Extract congress number from URL
          const congressMatch = request.url.match(/\/congress\/bills\/(\d+)\//);
          const congress = congressMatch ? parseInt(congressMatch[1]!) : undefined;

          // Extract chamber (house/senate) from bill number
          const chamber = billNumber.toLowerCase().startsWith('h.') ? 'House' : 'Senate';

          // Extract summary
          const summary = await page
            .locator('.summary')
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => undefined);

          // Try to get full text (may not always be available)
          const fullText = await page
            .locator('.bill-text')
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
            sourceWebsite: 'govtrack',
          };

          log.info(`Scraped bill: ${billNumber} - ${title}`);

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

  // Start with the bills status page
  await crawler.run(['https://www.govtrack.us/congress/bills/#bystatus']);

  // Get the bill links from the dataset
  const dataset = await Dataset.open();
  const data = await dataset.getData();
  const billLinksData = data.items.find((item: any) => item.type === 'billLinks');

  if (billLinksData && Array.isArray(billLinksData.links)) {
    // Now scrape each bill page
    await crawler.run(billLinksData.links);
  }

  console.log('GovTrack scraper completed');
}
