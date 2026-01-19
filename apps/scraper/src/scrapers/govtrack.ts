import { CheerioCrawler } from "crawlee";

import { upsertBill, resetMetrics, printMetricsSummary } from "../utils/db.js";

export async function scrapeGovTrack() {
  console.log("Starting GovTrack scraper...");

  // Reset metrics for this scraper run
  resetMetrics();

  const collectedLinks = new Set<string>();
  const maxBills = 20;

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, log, crawler }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Handle the main listing page
      if (request.url.includes("/congress/bills") &&
          (request.url.endsWith("/congress/bills") ||
           request.url.endsWith("/congress/bills/") ||
           request.url.includes("#docket"))) {
        // Extract bill links from the listing page
        $('a[href*="/congress/bills/"]').each((_, element) => {
          const href = $(element).attr("href");
          if (href && /\/congress\/bills\/\d+\/[a-z]+\d+/.test(href)) {
            // Convert relative URLs to absolute
            const fullUrl = href.startsWith("http")
              ? href
              : `https://www.govtrack.us${href}`;

            if (collectedLinks.size < maxBills) {
              collectedLinks.add(fullUrl);
            }
          }
        });

        log.info(`Found ${collectedLinks.size} total bill links so far`);
      }
      // Handle individual bill pages
      else if (/\/congress\/bills\/\d+\/[a-z]+\d+/.test(request.url)) {
        try {
          // Extract bill number and title from h1
          const h1Text = $("h1").first().text().trim();
          const h1Parts = h1Text.split(":");
          const billNumber = h1Parts[0]?.trim() || "";
          const title = h1Parts.length > 1
            ? h1Parts.slice(1).join(":").trim()
            : h1Text;

          // Extract sponsor
          let sponsor: string | undefined;
          $("p, div").each((_, element) => {
            const text = $(element).text();
            if (text.includes("Sponsor:")) {
              sponsor = text.replace("Sponsor:", "").trim();
              return false; // break
            }
          });

          // Extract status
          const status = $(".bill-status").first().text().trim() || "Unknown";

          // Extract introduced date
          let introducedDate: Date | undefined;
          $("p, div").each((_, element) => {
            const text = $(element).text();
            if (text.includes("Introduced:")) {
              const dateStr = text.replace("Introduced:", "").trim();
              introducedDate = new Date(dateStr);
              return false; // break
            }
          });

          // Extract congress number from URL
          const congressMatch = request.url.match(/\/congress\/bills\/(\d+)\//);
          const congress = congressMatch ? parseInt(congressMatch[1]!) : undefined;

          // Extract chamber (house/senate) from bill number
          const chamber = billNumber.toLowerCase().startsWith("h.")
            ? "House"
            : "Senate";

          // Extract summary
          const summary = $(".summary").first().text().trim() || undefined;

          // Try to get full text (may not always be available)
          const fullText = $(".bill-text").first().text().trim() || undefined;

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
            sourceWebsite: "govtrack",
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
    requestHandlerTimeoutSecs: 60,
  });

  // Start by crawling the bills listing page to collect bill links
  await crawler.run(["https://www.govtrack.us/congress/bills/#docket"]);

  console.log(
    `Collected ${collectedLinks.size} bill links, now scraping bills...`,
  );

  // Now scrape each collected bill
  if (collectedLinks.size > 0) {
    await crawler.run([...collectedLinks].slice(0, maxBills));
  }

  console.log("GovTrack scraper completed");

  // Print metrics summary
  printMetricsSummary("GovTrack");
}
