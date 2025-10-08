import type { Page } from 'playwright';
import { ScraperUtils } from '../utils.js';
import type { Spider, ScrapedExecutiveAction, ScraperConfig } from '../types.js';

export class WhiteHouseSpider implements Spider {
  name = 'whitehouse';
  
  constructor(private config: ScraperConfig = {}) {}
  
  async scrape(): Promise<ScrapedExecutiveAction[]> {
    const page = await ScraperUtils.createPage(this.config);
    const results: ScrapedExecutiveAction[] = [];
    
    try {
      console.log('🏛️  Starting White House spider...');
      
      // Navigate to presidential actions page
      await page.goto('https://www.whitehouse.gov/presidential-actions/', {
        waitUntil: 'networkidle'
      });
      
      let hasNextPage = true;
      let pageCount = 0;
      
      while (hasNextPage && pageCount < 10) { // Limit to 10 pages to avoid infinite loops
        pageCount++;
        console.log(`📄 Processing page ${pageCount}...`);
        
        // Extract action links
        const actionLinks = await page.$$eval(
          'h2 a[href*="/presidential-actions/"], a[href*="/presidential-actions/20"]',
          (links) => links
            .map(link => link.getAttribute('href'))
            .filter(href => href && href.includes('/presidential-actions/') && !href.endsWith('/presidential-actions/'))
        );
        
        console.log(`🔗 Found ${actionLinks.length} action links on page ${pageCount}`);
        
        // Process each action
        for (const link of actionLinks) {
          if (link) {
            const fullUrl = new URL(link, 'https://www.whitehouse.gov').toString();
            
            try {
              const action = await this.scrapeAction(page, fullUrl);
              if (action) {
                results.push(action);
              }
              
              // Add delay between requests
              await ScraperUtils.delay(this.config.delay ?? 1000);
            } catch (error) {
              console.error(`❌ Error scraping action ${fullUrl}:`, error);
            }
          }
        }
        
        // Check for next page
        try {
          const nextButton = await page.$('a[aria-label="Next"], .pagination .next a, a:has-text("Next")');
          if (nextButton) {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
            await ScraperUtils.delay(2000);
          } else {
            hasNextPage = false;
          }
        } catch (error) {
          console.log('📄 No more pages to process');
          hasNextPage = false;
        }
      }
      
    } catch (error) {
      console.error('❌ Error in White House spider:', error);
      throw error;
    } finally {
      await page.close();
    }
    
    console.log(`✅ White House spider completed. Scraped ${results.length} actions.`);
    return results;
  }
  
  private async scrapeAction(page: Page, url: string): Promise<ScrapedExecutiveAction | null> {
    try {
      console.log(`🔍 Scraping action: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Extract title
      const title = await page.$eval('h1', el => el.textContent?.trim())
        .catch(() => null);
      
      if (!title) {
        console.log(`⚠️  No title found for ${url}`);
        return null;
      }
      
      // Extract date
      const dateText = await page.$eval('time', el => 
        el.getAttribute('datetime') || el.textContent
      ).catch(() => null);
      
      const signedDate = dateText ? ScraperUtils.extractDateFromText(dateText) : null;
      
      // Extract content
      const contentParagraphs = await page.$$eval(
        '.entry-content p, .content p, .post-content p, main p, article p',
        elements => elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 10)
      ).catch(() => []);
      
      const description = contentParagraphs.join(' ');
      
      // Extract summary from meta description or first substantial paragraph
      const summary = await page.$eval('meta[name="description"]', el => 
        el.getAttribute('content')
      ).catch(() => {
        return contentParagraphs.length > 0 ? contentParagraphs[0] : null;
      });
      
      // Extract subjects/categories
      const subjects = await page.$$eval(
        '.categories a, .tags a, .breadcrumb a, nav a',
        elements => elements
          .map(el => el.textContent?.trim())
          .filter(text => text && text !== 'Presidential Actions')
      ).catch(() => []);
      
      // Generate action details
      const actionType = ScraperUtils.extractActionType(title, url);
      const actionNumber = ScraperUtils.extractActionNumber(title);
      const actionId = ScraperUtils.generateActionId(title, signedDate, url);
      
      const action: ScrapedExecutiveAction = {
        actionId,
        title,
        description: description || null,
        actionType,
        actionNumber,
        signedDate,
        publishedDate: signedDate, // Usually the same for White House
        summary,
        subjects: subjects.length > 0 ? JSON.stringify(subjects) : null,
        sourceUrl: url,
        fullTextUrl: url,
        sourceSite: 'whitehouse.gov',
        scrapedDate: new Date(),
      };
      
      console.log(`✅ Scraped: ${title.substring(0, 60)}...`);
      return action;
      
    } catch (error) {
      console.error(`❌ Error scraping action ${url}:`, error);
      return null;
    }
  }
}