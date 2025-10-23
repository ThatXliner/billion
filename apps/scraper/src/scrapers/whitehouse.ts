import { Dataset, PlaywrightCrawler } from "crawlee";

import { upsertPresidentialAction } from "../utils/db.js";

export async function scrapeWhiteHouse() {
  console.log("Starting White House scraper...");

  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Wait for the page to load
      await page.waitForLoadState("networkidle");

      // Handle the main listing page
      if (
        request.url.endsWith("/presidential-actions") ||
        request.url.endsWith("/presidential-actions/")
      ) {
        // Extract presidential action links
        const actionLinks = await page.$$eval(
          'a[href*="/presidential-actions/"]',
          (links) =>
            links
              .map((link) => (link as HTMLAnchorElement).href)
              .filter(
                (href) =>
                  href.includes("/presidential-actions/") &&
                  !href.endsWith("/presidential-actions/"),
              )
              .slice(0, 20), // Limit to first 20 actions for testing
        );

        log.info(`Found ${actionLinks.length} presidential action links`);

        // Return action links to be processed
        await Dataset.pushData({
          type: "actionLinks",
          links: [...new Set(actionLinks)], // Remove duplicates
        });
      }
      // Handle individual action pages
      else {
        try {
          // Extract action title
          const title = await page
            .locator("h1")
            .first()
            .textContent()
            .then((text) => text?.trim() || "Untitled Action");

          // Determine type from title or URL
          let type = "Presidential Action";
          const titleLower = title.toLowerCase();
          if (titleLower.includes("executive order")) {
            type = "Executive Order";
          } else if (titleLower.includes("memorandum")) {
            type = "Memorandum";
          } else if (titleLower.includes("proclamation")) {
            type = "Proclamation";
          }

          // Extract issued date
          const issuedDateStr = await page
            .locator("time, .date, .published-date")
            .first()
            .getAttribute("datetime")
            .catch(() =>
              page
                .locator("time, .date, .published-date")
                .first()
                .textContent()
                .then((text) => text?.trim()),
            )
            .catch(() => undefined);

          const issuedDate = issuedDateStr
            ? new Date(issuedDateStr)
            : new Date();

          // Extract description/summary
          const description = await page
            .locator(".summary, .excerpt, p")
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => undefined);

          // Extract full text
          const fullText = await page
            .locator(".entry-content")
            .first()
            .textContent()
            .then((text) => text?.trim())
            .catch(() => undefined);

          const actionData = {
            title,
            type,
            issuedDate,
            description,
            fullText,
            url: request.url,
          };

          log.info(`Scraped action: ${title}`);

          // Save to database
          await upsertPresidentialAction(actionData);
        } catch (error) {
          log.error(`Error scraping action from ${request.url}:`, error);
        }
      }
    },
    maxRequestsPerCrawl: 50, // Limit for testing
    headless: true,
    requestHandlerTimeoutSecs: 60,
  });

  // Start with the presidential actions listing page
  await crawler.run(["https://www.whitehouse.gov/presidential-actions/"]);

  // Get the action links from the dataset
  const dataset = await Dataset.open();
  const data = await dataset.getData();
  const actionLinksData = data.items.find(
    (item: any) => item.type === "actionLinks",
  );

  if (actionLinksData && Array.isArray(actionLinksData.links)) {
    // Now scrape each action page
    await crawler.run(actionLinksData.links);
  }

  console.log("White House scraper completed");
}
