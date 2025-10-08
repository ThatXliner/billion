import type { Page } from 'playwright';
import { ScraperUtils } from '../utils.js';
import type { Spider, ScrapedBill, ScraperConfig } from '../types.js';

export class GovTrackSpider implements Spider {
  name = 'govtrack';
  
  constructor(private config: ScraperConfig = {}) {}
  
  async scrape(): Promise<ScrapedBill[]> {
    const page = await ScraperUtils.createPage(this.config);
    const results: ScrapedBill[] = [];
    
    try {
      console.log('🏛️  Starting GovTrack spider...');
      
      // Navigate to bills page
      await page.goto('https://www.govtrack.us/congress/bills/', {
        waitUntil: 'networkidle'
      });
      
      // Extract bill links from the current page
      const billLinks = await page.$$eval(
        'a[href*="/congress/bills/"]',
        (links: any[]) => links
          .map((link: any) => link.href)
          .filter((href: string) => href && href.includes('/congress/bills/') && href.match(/\/\d+$/))
          .slice(0, 10) // Limit to 10 bills for demo
      );
      
      console.log(`🔗 Found ${billLinks.length} bill links`);
      
      // Process each bill
      for (const link of billLinks) {
        try {
          const bill = await this.scrapeBill(page, link);
          if (bill) {
            results.push(bill);
          }
          
          await ScraperUtils.delay(this.config.delay ?? 2000);
        } catch (error) {
          console.error(`❌ Error scraping bill ${link}:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in GovTrack spider:', error);
      throw error;
    } finally {
      await page.close();
    }
    
    console.log(`✅ GovTrack spider completed. Scraped ${results.length} bills.`);
    return results;
  }
  
  private async scrapeBill(page: Page, url: string): Promise<ScrapedBill | null> {
    try {
      console.log(`🔍 Scraping bill: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Extract title
      const title = await page.$eval('h1', (el: any) => el.textContent?.trim())
        .catch(() => null);
      
      if (!title) {
        console.log(`⚠️  No title found for ${url}`);
        return null;
      }
      
      // Extract bill number and session from URL or page
      const urlMatch = url.match(/\/congress\/bills\/(\d+)\/(\w+)(\d+)/);
      const congressSession = urlMatch?.[1] || null;
      const billTypeCode = urlMatch?.[2] || '';
      const billNumber = urlMatch?.[3] || null;
      
      const billType = this.mapBillType(billTypeCode);
      
      // Extract sponsor
      const sponsor = await page.$eval(
        '.sponsor, [class*="sponsor"]',
        (el: any) => el.textContent?.trim()
      ).catch(() => null);
      
      // Extract summary
      const summary = await page.$eval(
        '.summary, [class*="summary"], .description',
        (el: any) => el.textContent?.trim()
      ).catch(() => null);
      
      // Extract status
      const status = await page.$eval(
        '.status, [class*="status"]',
        (el: any) => el.textContent?.trim()
      ).catch(() => null);
      
      // Generate bill ID
      const billId = congressSession && billNumber 
        ? ScraperUtils.generateBillId(billNumber, congressSession)
        : null;
      
      const bill: ScrapedBill = {
        billId,
        title,
        description: title, // Use title as description for now
        summary,
        billType,
        billNumber,
        congressSession,
        introducedDate: null, // Could be extracted if needed
        signedDate: null,
        lastActionDate: null,
        status,
        currentStage: null,
        lastAction: null,
        sponsor,
        cosponsors: null,
        committees: null,
        housePassageVote: null,
        senatePassageVote: null,
        subjects: null,
        policyAreas: null,
        sourceUrl: url,
        fullTextUrl: null,
        congressGovUrl: null,
        sourceSite: 'govtrack.us',
        scrapedDate: new Date(),
      };
      
      console.log(`✅ Scraped: ${title.substring(0, 60)}...`);
      return bill;
      
    } catch (error) {
      console.error(`❌ Error scraping bill ${url}:`, error);
      return null;
    }
  }
  
  private mapBillType(code: string): string {
    const typeMap: Record<string, string> = {
      'hr': 'house_bill',
      's': 'senate_bill',
      'hres': 'house_resolution',
      'sres': 'senate_resolution',
      'hjres': 'house_joint_resolution',
      'sjres': 'senate_joint_resolution',
      'hconres': 'house_concurrent_resolution',
      'sconres': 'senate_concurrent_resolution',
    };
    
    return typeMap[code.toLowerCase()] || 'bill';
  }
}