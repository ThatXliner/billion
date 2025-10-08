export const name = "scraper";

// Export main classes and types
export { ScraperRunner } from './scraper.js';
export { WhiteHouseSpider } from './spiders/whitehouse.js';
export { CongressSpider } from './spiders/congress.js';
export { GovTrackSpider } from './spiders/govtrack.js';
export { ScraperUtils } from './utils.js';
export { DatabaseService } from './database-simple.js';
export type {
  ScrapedBill,
  ScrapedExecutiveAction,
  ScraperConfig,
  ScraperStats,
  SpiderName,
  Spider
} from './types.js';

// Import types for function
import type { SpiderName, ScraperConfig } from './types.js';
import { ScraperRunner } from './scraper.js';

// Main scraper function for programmatic use
export async function runScraper(spider: SpiderName = 'all', config?: ScraperConfig) {
  const runner = new ScraperRunner(config);
  return await runner.runSpider(spider);
}
