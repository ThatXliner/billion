import { CheerioCrawler } from "crawlee";

import { printMetricsSummary, resetMetrics } from "../utils/db/metrics.js";
import { upsertBill } from "../utils/db/operations.js";

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
      if (
        request.url.includes("/congress/bills") &&
        (request.url.endsWith("/congress/bills") ||
          request.url.endsWith("/congress/bills/") ||
          request.url.includes("#docket"))
      ) {
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
      // Handle bill text pages
      else if (request.url.includes("/text")) {
        try {
          // Extract full text from the specific element
          let fullText = $(
            "html body.bills div#bodybody div div.container div.row div.col-sm-8.order-1 div#content article.bill",
          )
            .text()
            .trim();

          // Truncate to 1,000 words
          if (fullText) {
            const words = fullText.split(/\s+/);
            if (words.length > 1000) {
              fullText = words.slice(0, 1000).join(" ");
              log.info(
                `Truncated full text from ${words.length} to 1,000 words`,
              );
            }
          }

          // Extract bill number and title from h1
          const h1Text = $(".h1-multiline > h1:nth-child(1)")
            .first()
            .text()
            .trim();
          const h1Parts = h1Text.split(":");
          const billNumber = h1Parts[0]?.trim() || "";
          const title =
            h1Parts.length > 1 ? h1Parts.slice(1).join(":").trim() : h1Text;

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
          const congress = congressMatch
            ? parseInt(congressMatch[1]!)
            : undefined;

          // Extract chamber (house/senate) from bill number
          const chamber = billNumber.toLowerCase().startsWith("h.")
            ? "House"
            : "Senate";

          // Extract summary
          const summary = $(".summary").first().text().trim() || undefined;

          // Remove /text from the URL to get the original bill URL
          const billUrl = request.url.replace(/\/text$/, "");

          const billData = {
            billNumber: "q",
            title: "2",
            description: "summary",
            sponsor: "2",
            status: "2",
            introducedDate: new Date(),
            congress: 1,
            chamber: "2",
            summary: "h",
            fullText,
            url: billUrl,
            sourceWebsite: "govtrack",
          };

          // console.log(fullText);

          log.info(
            `Scraped bill with full text: ${billNumber} - ${title} (${fullText.length} characters)`,
          );

          // Save complete bill data with full text

          if (fullText != "") {
            await upsertBill(billData);
          }
        } catch (error) {
          console.log(error);
          log.error(`Error scraping full text from ${request.url}:`, error);
        }
      }
    },
    maxRequestsPerCrawl: 100, // Increased to accommodate text pages
    requestHandlerTimeoutSecs: 60,
  });

  // Start by crawling the bills listing page to collect bill links
  await crawler.run(["https://www.govtrack.us/congress/bills/#docket"]);

  console.log(
    `Collected ${collectedLinks.size} bill links, now scraping bills...`,
  );

  // Now scrape text pages directly (they have all the info we need)
  if (collectedLinks.size > 0) {
    const billUrls = [...collectedLinks].slice(0, maxBills);
    const textUrls = billUrls.map((url) => `${url}/text`);

    console.log(
      `Scraping ${textUrls.length} text pages with full bill data...`,
    );
    await crawler.run(textUrls);
  }

  console.log("GovTrack scraper completed");

  // Print metrics summary
  printMetricsSummary("GovTrack");
}
