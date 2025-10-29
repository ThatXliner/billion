import { CheerioCrawler, Dataset } from "crawlee";

import { upsertPresidentialAction } from "../utils/db.js";

export async function scrapeWhiteHouse() {
  console.log("Starting White House scraper...");

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.loadedUrl}`);

      // Handle the main news listing page
      if (request.url.includes("/news")) {
        // Extract article links using the specified selector
        const articleLinks: string[] = [];
        $(".wp-block-post-title > a").each((_, element) => {
          const href = $(element).attr("href");
          if (href) {
            articleLinks.push(href);
          }
        });

        log.info(
          `Found ${articleLinks.length} article links on ${request.url}`,
        );

        // Return article links to be processed
        await Dataset.pushData({
          type: "articleLinks",
          links: articleLinks,
        });
        const dataset = await Dataset.open();
        const data = await dataset.getData();

        // Get all article links collected so far
        const allLinks = data.items
          .filter((item: any) => item.type === "articleLinks")
          .flatMap((item: any) => item.links);

        // If we have fewer than 20 articles, try to find the next page
        if (allLinks.length < 20) {
          const nextPageLink = $(".wp-block-query-pagination-next").attr(
            "href",
          );

          if (nextPageLink) {
            log.info(`Found next page: ${nextPageLink}`);
            await Dataset.pushData({
              type: "paginationLinks",
              links: [nextPageLink],
            });
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

  // Start with the news listing page
  await crawler.run(["https://www.whitehouse.gov/news/"]);

  // Get the article links from the dataset
  let dataset = await Dataset.open();
  let data = await dataset.getData();

  // Check if we need to crawl pagination pages
  let paginationLinksData = data.items.find(
    (item: any) => item.type === "paginationLinks",
  );

  while (paginationLinksData && Array.isArray(paginationLinksData.links)) {
    // Crawl the next page
    await crawler.run(paginationLinksData.links);

    // Refresh dataset to check for more pagination
    dataset = await Dataset.open();
    data = await dataset.getData();

    // Get all article links collected so far
    const allLinks = data.items
      .filter((item: any) => item.type === "articleLinks")
      .flatMap((item: any) => item.links);

    // Stop if we have 20 or more articles
    if (allLinks.length >= 20) {
      break;
    }

    // // Look for the next pagination link in the newly added items
    // const newPaginationData = data.items
    //   .filter((item: any) => item.type === "paginationLinks")
    //   .slice(-1)[0]; // Get the most recent pagination data

    // paginationLinksData = newPaginationData;
  }

  // Get all unique article links (limit to 20)
  const allArticleLinks = [
    ...new Set(
      data.items
        .filter((item: any) => item.type === "articleLinks")
        .flatMap((item: any) => item.links),
    ),
  ].slice(0, 20);

  console.log(
    `Collected ${allArticleLinks.length} article links, now scraping articles...`,
  );

  if (allArticleLinks.length > 0) {
    // Now scrape each article page
    await crawler.run(allArticleLinks);
  }

  console.log("White House scraper completed");
}
