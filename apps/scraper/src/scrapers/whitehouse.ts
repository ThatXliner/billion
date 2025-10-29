import { CheerioCrawler } from "crawlee";

import { upsertPresidentialAction } from "../utils/db.js";

export async function scrapeWhiteHouse() {
  console.log("Starting White House scraper...");

  const collectedLinks = new Set<string>();
  const maxArticles = 20;

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, log, crawler }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Handle the main news listing page
      if (request.url.includes("/news") &&
          (request.url.endsWith("/news") ||
           request.url.endsWith("/news/") ||
           request.url.includes("/news/page/"))) {

        // Extract article links using the specified selector
        $(".wp-block-post-title > a").each((_, element) => {
          const href = $(element).attr("href");
          if (href && collectedLinks.size < maxArticles) {
            collectedLinks.add(href);
          }
        });

        log.info(
          `Found ${collectedLinks.size} total article links so far`,
        );

        // If we need more articles, find and queue the next page
        if (collectedLinks.size < maxArticles) {
          const nextPageLink = $(".wp-block-query-pagination-next").attr("href");

          if (nextPageLink) {
            log.info(`Queuing next page: ${nextPageLink}`);
            await crawler.addRequests([nextPageLink]);
          }
        }
      }
      // Handle individual article pages
      else {
        try {
          // Extract headline from the specified selector
          let headline = $(".wp-block-whitehouse-topper__headline")
            .first()
            .text()
            .trim();

          // Fallback to h1 if headline not found
          if (!headline) {
            headline = $("h1").first().text().trim() || "Untitled Article";
          }

          // Extract date from the specified selector
          const dateStr =
            $(".wp-block-post-date > time").first().attr("datetime") ||
            $(".wp-block-post-date > time").first().text().trim();

          const issuedDate = dateStr ? new Date(dateStr) : new Date();

          // Extract content - all elements after the first div in .entry-content
          const entryContent = $(".entry-content").first();
          let fullText = "";

          if (entryContent.length > 0) {
            const children = entryContent.children();
            let firstDivIndex = -1;

            // Find the first div
            children.each((index, element) => {
              if (
                element.tagName.toLowerCase() === "div" &&
                firstDivIndex === -1
              ) {
                firstDivIndex = index;
              }
            });

            if (firstDivIndex === -1) {
              // No div found, get all content
              fullText = entryContent.text().trim();
            } else {
              // Get all elements after the first div
              const textParts: string[] = [];
              children.each((index, element) => {
                if (index > firstDivIndex) {
                  const text = $(element).text().trim();
                  if (text) {
                    textParts.push(text);
                  }
                }
              });
              fullText = textParts.join("\n\n");
            }
          }

          // Determine content type from URL
          let contentType = "News Article";
          if (request.url.includes("/fact-sheets/")) {
            contentType = "Fact Sheet";
          } else if (request.url.includes("/briefings-statements/")) {
            contentType = "Briefing Statement";
          } else if (request.url.includes("/presidential-actions/")) {
            contentType = "Presidential Action";
          }

          const contentData = {
            title: headline,
            type: contentType,
            publishedDate: issuedDate,
            description: fullText?.substring(0, 500), // First 500 chars as description
            fullText,
            url: request.url,
            source: "whitehouse.gov",
          };

          log.info(`Scraped ${contentType}: ${headline}`);

          // Save to database
          await upsertPresidentialAction(contentData);
        } catch (error) {
          log.error(`Error scraping article from ${request.url}:`, error);
        }
      }
    },
    maxRequestsPerCrawl: 50, // Limit for testing
    requestHandlerTimeoutSecs: 60,
  });

  // Start by crawling the news listing page to collect article links
  await crawler.run(["https://www.whitehouse.gov/news/"]);

  console.log(
    `Collected ${collectedLinks.size} article links, now scraping articles...`,
  );

  // Now scrape each collected article
  if (collectedLinks.size > 0) {
    await crawler.run([...collectedLinks].slice(0, maxArticles));
  }

  console.log("White House scraper completed");
}
