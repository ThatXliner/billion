import type { Page } from 'playwright';
import { ScraperUtils } from '../utils.js';
import type { Spider, ScrapedBill, ScraperConfig } from '../types.js';

export class CongressSpider implements Spider {
  name = 'congress';
  
  constructor(private config: ScraperConfig = {}) {}
  
  async scrape(): Promise<ScrapedBill[]> {
    const page = await ScraperUtils.createPage(this.config);
    const results: ScrapedBill[] = [];
    
    try {
      console.log('🏛️  Starting Congress spider...');
      
      // Start URLs for different congress sessions
      const startUrls = [
        'https://www.congress.gov/bills',
        'https://www.congress.gov/bills/browse?q=%7B%22congress%22%3A118%7D',
        'https://www.congress.gov/bills/browse?q=%7B%22congress%22%3A117%7D',
      ];
      
      for (const startUrl of startUrls) {
        await this.scrapeBillsFromUrl(page, startUrl, results);
        await ScraperUtils.delay(2000);
      }
      
    } catch (error) {
      console.error('❌ Error in Congress spider:', error);
      throw error;
    } finally {
      await page.close();
    }
    
    console.log(`✅ Congress spider completed. Scraped ${results.length} bills.`);
    return results;
  }
  
  private async scrapeBillsFromUrl(page: Page, url: string, results: ScrapedBill[]): Promise<void> {
    let pageCount = 0;
    let currentUrl = url;
    
    while (pageCount < 5) { // Limit to 5 pages per start URL
      pageCount++;
      console.log(`📄 Processing Congress page ${pageCount} from ${url}...`);
      
      try {
        await page.goto(currentUrl, { waitUntil: 'networkidle' });
        
        // Extract bill links
        const billLinks = await page.$$eval(
          'a[href*="/bill/"], .result-heading a',
          (links: Element[]) => links
            .map(link => (link as HTMLAnchorElement).href)
            .filter(href => href && href.includes('/bill/'))
        );
        
        console.log(`🔗 Found ${billLinks.length} bill links on page ${pageCount}`);
        
        // Process each bill
        for (const link of billLinks.slice(0, 20)) { // Limit to 20 bills per page
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
        
        // Look for next page
        const nextLink = await page.$eval(
          'a[aria-label="Next"], .pagination .next a',
          (el: HTMLAnchorElement) => el.href
        ).catch(() => null);
        
        if (nextLink) {
          currentUrl = nextLink;
          await ScraperUtils.delay(3000);
        } else {
          break;
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${currentUrl}:`, error);
        break;
      }
    }
  }
  
  private async scrapeBill(page: Page, url: string): Promise<ScrapedBill | null> {
    try {
      console.log(`🔍 Scraping bill: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Extract bill number and type from URL
      const billMatch = url.match(/\/bill\/(\d+)(?:th|st|nd|rd)-congress\/([^/]+)\/(\d+)/);
      const congressSession = billMatch?.[1] || null;
      const billTypeSlug = billMatch?.[2] || '';
      const billNumber = billMatch?.[3] || null;
      
      // Extract title
      const title = await page.$eval('h1', (el: Element) => el.textContent?.trim())
        .catch(() => null);
      
      if (!title) {
        console.log(`⚠️  No title found for ${url}`);
        return null;
      }
      
      // Extract bill type
      const billType = ScraperUtils.extractBillType(billTypeSlug);
      
      // Extract sponsor
      const sponsor = await page.$eval(
        '.sponsor a, .bill-sponsor',
        (el: Element) => el.textContent?.trim()
      ).catch(() => null);
      
      // Extract cosponsors
      const cosponsors = await page.$$eval(
        '.cosponsors a, .cosponsor',
        (elements: Element[]) => elements.map(el => el.textContent?.trim()).filter(Boolean)
      ).catch(() => []);
      
      // Extract committees
      const committees = await page.$$eval(
        '.committees a, .committee',
        (elements: Element[]) => elements.map(el => el.textContent?.trim()).filter(Boolean)
      ).catch(() => []);
      
      // Extract dates
      const introducedDate = await this.extractDate(page, 'introduced');
      const signedDate = await this.extractDate(page, 'signed', 'enacted');
      const lastActionDate = await this.extractDate(page, 'last action', 'latest action');
      
      // Extract status and stage
      const status = await page.$eval('.bill-status, .status', (el: Element) => 
        el.textContent?.trim()
      ).catch(() => null);
      
      const currentStage = await page.$eval('.bill-stage, .stage', (el: Element) => 
        el.textContent?.trim()
      ).catch(() => null);
      
      // Extract last action
      const lastAction = await page.$eval(
        '.latest-action, .last-action, .actions li:first-child',
        (el: Element) => el.textContent?.trim()
      ).catch(() => null);
      
      // Extract summary
      const summaryParagraphs = await page.$$eval(
        '.bill-summary p, .summary p',
        (elements: Element[]) => elements
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 20)
      ).catch(() => []);
      
      const summary = summaryParagraphs.join(' ') || null;
      
      // Extract description (meta description or title)
      const description = await page.$eval(
        'meta[name="description"]',
        (el: HTMLMetaElement) => el.content
      ).catch(() => title);
      
      // Extract subjects
      const subjects = await page.$$eval(
        '.subjects a, .subject',
        (elements: Element[]) => elements.map(el => el.textContent?.trim()).filter(Boolean)
      ).catch(() => []);
      
      // Extract policy areas
      const policyAreas = await page.$$eval(
        '.policy-areas a, .policy-area',
        (elements: Element[]) => elements.map(el => el.textContent?.trim()).filter(Boolean)
      ).catch(() => []);
      
      // Extract full text URL
      const fullTextUrl = await page.$eval(
        'a[href*="/text/"]',
        (el: HTMLAnchorElement) => new URL(el.href, page.url()).toString()
      ).catch(() => null);
      
      // Generate bill ID
      const billId = congressSession && billNumber 
        ? ScraperUtils.generateBillId(billNumber, congressSession)
        : null;
      
      const bill: ScrapedBill = {
        billId,
        title,
        description,
        summary,
        billType,
        billNumber,
        congressSession,
        introducedDate,
        signedDate,
        lastActionDate,
        status,
        currentStage,
        lastAction,
        sponsor,
        cosponsors: cosponsors.length > 0 ? JSON.stringify(cosponsors) : null,
        committees: committees.length > 0 ? JSON.stringify(committees) : null,
        housePassageVote: null, // Could be extracted if needed
        senatePassageVote: null, // Could be extracted if needed
        subjects: subjects.length > 0 ? JSON.stringify(subjects) : null,
        policyAreas: policyAreas.length > 0 ? JSON.stringify(policyAreas) : null,
        sourceUrl: url,
        fullTextUrl,
        congressGovUrl: url,
        sourceSite: 'congress.gov',
        scrapedDate: new Date(),
      };
      
      console.log(`✅ Scraped: ${title.substring(0, 60)}...`);
      return bill;
      
    } catch (error) {
      console.error(`❌ Error scraping bill ${url}:`, error);
      return null;
    }
  }
  
  private async extractDate(page: Page, ...labels: string[]): Promise<Date | null> {
    for (const label of labels) {
      try {
        // Look for date near label text
        const dateText = await page.$eval(
          `*:has-text("${label}") ~ *, *:has-text("${label}")`,
          (el: Element) => {
            const text = el.textContent || '';
            return ScraperUtils.extractDateFromText(text)?.toISOString() || null;
          }
        );
        
        if (dateText) {
          return new Date(dateText);
        }
      } catch (error) {
        // Continue to next label
      }
    }
    
    return null;
  }
}