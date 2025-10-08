import { chromium, type Browser, type Page } from 'playwright';
import type { ScraperConfig } from './types.js';

export class ScraperUtils {
  private static browser: Browser | null = null;
  
  static async getBrowser(config: ScraperConfig = {}): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: config.headless ?? true,
      });
    }
    return this.browser;
  }
  
  static async createPage(config: ScraperConfig = {}): Promise<Page> {
    const browser = await this.getBrowser(config);
    const page = await browser.newPage({
      userAgent: config.userAgent ?? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    
    // Set timeout
    page.setDefaultTimeout(config.timeout ?? 30000);
    
    return page;
  }
  
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static extractDateFromText(text: string): Date | null {
    if (!text) return null;
    
    // Common date formats
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,           // MM/DD/YYYY
      /(\d{4}-\d{2}-\d{2})/g,                 // YYYY-MM-DD
      /([A-Za-z]+ \d{1,2}, \d{4})/g,         // Month DD, YYYY
      /(\d{1,2} [A-Za-z]+ \d{4})/g,          // DD Month YYYY
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }
    
    return null;
  }
  
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }
  
  static extractActionType(title: string, url?: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('executive order')) return 'executive_order';
    if (titleLower.includes('presidential memorandum')) return 'presidential_memorandum';
    if (titleLower.includes('proclamation')) return 'proclamation';
    if (titleLower.includes('national security memorandum')) return 'national_security_memorandum';
    
    if (url) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes('executive-order')) return 'executive_order';
      if (urlLower.includes('memorandum')) return 'presidential_memorandum';
      if (urlLower.includes('proclamation')) return 'proclamation';
    }
    
    return 'presidential_action';
  }
  
  static extractActionNumber(title: string): string | null {
    if (!title) return null;
    
    const patterns = [
      /Executive Order[:\s]+(\d+)/i,
      /EO[:\s]+(\d+)/i,
      /Proclamation[:\s]+(\d+)/i,
      /Presidential Memorandum[:\s]+(\d+)/i,
      /National Security Memorandum[:\s]+(\d+)/i,
      /NSM[:\s]+(\d+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) return match[1];
    }
    
    return null;
  }
  
  static extractBillType(identifier: string): string {
    if (!identifier) return 'bill';
    
    const id = identifier.toLowerCase();
    
    if (id.includes('house-bill') || id.includes('/hr/')) return 'house_bill';
    if (id.includes('senate-bill') || id.includes('/s/')) return 'senate_bill';
    if (id.includes('house-resolution') || id.includes('/hres/')) return 'house_resolution';
    if (id.includes('senate-resolution') || id.includes('/sres/')) return 'senate_resolution';
    if (id.includes('house-joint-resolution') || id.includes('/hjres/')) return 'house_joint_resolution';
    if (id.includes('senate-joint-resolution') || id.includes('/sjres/')) return 'senate_joint_resolution';
    if (id.includes('house-concurrent-resolution') || id.includes('/hconres/')) return 'house_concurrent_resolution';
    if (id.includes('senate-concurrent-resolution') || id.includes('/sconres/')) return 'senate_concurrent_resolution';
    
    return 'bill';
  }
  
  static generateActionId(title: string, date: Date | null, url?: string): string {
    // Try URL-based ID first
    if (url) {
      const urlParts = url.split('/');
      if (urlParts.length >= 3) {
        const urlId = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
        if (urlId && urlId.length > 10) {
          return `wh-${urlId}`;
        }
      }
    }
    
    if (!title) {
      return `wh-unknown-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Create ID from title and date
    const titleClean = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const dateStr = date ? date.toISOString().split('T')[0] : 'unknown';
    
    return `wh-${dateStr}-${titleClean}`;
  }
  
  static generateBillId(billNumber: string, congressSession: string): string {
    return `congress-${congressSession}-${billNumber}`;
  }
}