import { ScraperUtils } from './utils.js';
import { WhiteHouseSpider } from './spiders/whitehouse.js';
import { CongressSpider } from './spiders/congress.js';
import { GovTrackSpider } from './spiders/govtrack.js';
import { DatabaseService } from './database-simple.js';
import type { Spider, SpiderName, ScraperConfig, ScraperStats, ScrapedBill, ScrapedExecutiveAction } from './types.js';

export class ScraperRunner {
  private dbService: DatabaseService;
  
  constructor(private config: ScraperConfig = {}) {
    this.dbService = new DatabaseService();
  }
  
  async runSpider(spiderName: SpiderName): Promise<ScraperStats> {
    const stats: ScraperStats = {
      totalItems: 0,
      billsCount: 0,
      executiveActionsCount: 0,
      errors: 0,
      startTime: new Date(),
    };
    
    try {
      console.log(`🚀 Starting scraper for: ${spiderName}`);
      console.log('='.repeat(60));
      
      if (spiderName === 'all') {
        await this.runAllSpiders(stats);
      } else {
        await this.runSingleSpider(spiderName, stats);
      }
      
      stats.endTime = new Date();
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SCRAPING COMPLETED');
      console.log('='.repeat(60));
      this.printStats(stats);
      
      // Show database stats
      const dbStats = await this.dbService.getStats();
      console.log('\n📊 DATABASE STATISTICS:');
      console.log(`Total Bills: ${dbStats.totalBills}`);
      console.log(`Total Executive Actions: ${dbStats.totalActions}`);
      
    } catch (error) {
      console.error('❌ Error running scraper:', error);
      stats.errors++;
      throw error;
    } finally {
      await ScraperUtils.closeBrowser();
    }
    
    return stats;
  }
  
  private async runAllSpiders(stats: ScraperStats): Promise<void> {
    const spiders: SpiderName[] = ['whitehouse', 'congress', 'govtrack'];
    
    for (const spiderName of spiders) {
      try {
        console.log(`\n${'='.repeat(30)} ${spiderName.toUpperCase()} SPIDER ${'='.repeat(30)}`);
        await this.runSingleSpider(spiderName as Exclude<SpiderName, 'all'>, stats);
      } catch (error) {
        console.error(`❌ Error in ${spiderName} spider:`, error);
        stats.errors++;
      }
    }
  }
  
  private async runSingleSpider(spiderName: Exclude<SpiderName, 'all'>, stats: ScraperStats): Promise<void> {
    const spider = this.createSpider(spiderName);
    
    try {
      const results = await spider.scrape();
      
      // Separate bills and executive actions
      const bills = results.filter((item): item is ScrapedBill => 
        'billType' in item || 'billNumber' in item
      );
      const actions = results.filter((item): item is ScrapedExecutiveAction => 
        'actionType' in item || 'actionNumber' in item
      );
      
      // Save to database
      const savedBills = await this.dbService.saveBills(bills);
      const savedActions = await this.dbService.saveExecutiveActions(actions);
      
      stats.billsCount += savedBills;
      stats.executiveActionsCount += savedActions;
      stats.totalItems += savedBills + savedActions;
      
      console.log(`✅ ${spiderName} completed:`);
      console.log(`   - Bills: ${savedBills}`);
      console.log(`   - Executive Actions: ${savedActions}`);
      console.log(`   - Total: ${savedBills + savedActions}`);
      
    } catch (error) {
      console.error(`❌ Error in ${spiderName} spider:`, error);
      stats.errors++;
      throw error;
    }
  }
  
  private createSpider(spiderName: Exclude<SpiderName, 'all'>): Spider {
    switch (spiderName) {
      case 'whitehouse':
        return new WhiteHouseSpider(this.config);
      case 'congress':
        return new CongressSpider(this.config);
      case 'govtrack':
        return new GovTrackSpider(this.config);
      default:
        throw new Error(`Unknown spider: ${spiderName}`);
    }
  }
  
  private printStats(stats: ScraperStats): void {
    const duration = stats.endTime 
      ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000 
      : 0;
    
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total Items Scraped: ${stats.totalItems}`);
    console.log(`📄 Bills: ${stats.billsCount}`);
    console.log(`📜 Executive Actions: ${stats.executiveActionsCount}`);
    console.log(`❌ Errors: ${stats.errors}`);
  }
}