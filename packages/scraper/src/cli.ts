#!/usr/bin/env node

import { Command } from 'commander';
import { ScraperRunner } from './scraper.js';
import type { SpiderName, ScraperConfig } from './types.js';

const program = new Command();

program
  .name('scraper')
  .description('US Government Bills and Executive Orders Scraper (JavaScript version)')
  .version('1.0.0');

program
  .option('-s, --spider <spider>', 'which spider to run (whitehouse, congress, govtrack, all)', 'all')
  .option('--delay <ms>', 'delay between requests in milliseconds', '1000')
  .option('--timeout <ms>', 'page timeout in milliseconds', '30000')
  .option('--headless [boolean]', 'run browser in headless mode', true)
  .option('--max-retries <count>', 'maximum retries for failed requests', '3')
  .action(async (options) => {
    try {
      console.log('🏛️  US Government Bills and Executive Orders Scraper');
      console.log('='.repeat(60));
      console.log('📝 JavaScript version powered by Playwright and Drizzle ORM');
      console.log('');
      
      const config: ScraperConfig = {
        delay: parseInt(options.delay),
        timeout: parseInt(options.timeout),
        headless: options.headless !== false,
        maxRetries: parseInt(options.maxRetries),
      };
      
      const spider = options.spider as SpiderName;
      
      if (!['whitehouse', 'congress', 'govtrack', 'all'].includes(spider)) {
        console.error(`❌ Invalid spider: ${spider}`);
        console.log('Available spiders: whitehouse, congress, govtrack, all');
        process.exit(1);
      }
      
      console.log(`🎯 Target: ${spider === 'all' ? 'All spiders' : spider}`);
      console.log(`⏱️  Delay: ${config.delay}ms`);
      console.log(`⏰ Timeout: ${config.timeout}ms`);
      console.log(`👻 Headless: ${config.headless}`);
      console.log('');
      
      if (spider === 'all') {
        console.log('🌍 This will scrape:');
        console.log('   - White House Presidential Actions');
        console.log('   - Congress.gov Bills');
        console.log('   - GovTrack.us Bills');
        console.log('');
        console.log('⚠️  This may take a while. Please be patient...');
        console.log('');
      }
      
      const runner = new ScraperRunner(config);
      const stats = await runner.runSpider(spider);
      
      console.log('');
      console.log('🎊 Scraping completed successfully!');
      
    } catch (error) {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    }
  });

// Add command for showing database stats
program
  .command('stats')
  .description('show database statistics')
  .action(async () => {
    try {
      console.log('📊 Database Statistics');
      console.log('='.repeat(40));
      
      // TODO: Implement actual database stats when DB integration is complete
      console.log('Database integration not yet complete.');
      console.log('Run the scraper to see scraped data output.');
      
    } catch (error) {
      console.error('❌ Error showing stats:', error);
      process.exit(1);
    }
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}