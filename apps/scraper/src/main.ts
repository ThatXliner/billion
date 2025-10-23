// Government data scraper for Billion app
// Scrapes bills, presidential actions, and court cases from government websites
import dotenv from 'dotenv';
import { scrapeGovTrack } from './scrapers/govtrack.js';
import { scrapeWhiteHouse } from './scrapers/whitehouse.js';
import { scrapeCongress } from './scrapers/congress.js';

// Load environment variables
dotenv.config({ path: '../../.env' });

async function main() {
  console.log('Starting government data scrapers...\n');

  const args = process.argv.slice(2);
  const scraperArg = args[0]?.toLowerCase();

  try {
    if (!scraperArg || scraperArg === 'all') {
      // Run all scrapers
      console.log('Running all scrapers...\n');

      await scrapeGovTrack();
      console.log('\n---\n');

      await scrapeWhiteHouse();
      console.log('\n---\n');

      await scrapeCongress();
      console.log('\n---\n');

      console.log('All scrapers completed successfully!');
    } else if (scraperArg === 'govtrack') {
      await scrapeGovTrack();
    } else if (scraperArg === 'whitehouse') {
      await scrapeWhiteHouse();
    } else if (scraperArg === 'congress') {
      await scrapeCongress();
    } else {
      console.error('Invalid scraper name. Available options: govtrack, whitehouse, congress, all');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running scrapers:', error);
    process.exit(1);
  }
}

main();
