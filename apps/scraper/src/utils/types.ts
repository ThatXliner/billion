/**
 * Shared TypeScript interfaces for the scraper application
 */

// Bill data structure
export interface BillData {
  billNumber: string;
  title: string;
  description?: string;
  sponsor?: string;
  status?: string;
  introducedDate?: Date;
  congress?: number;
  chamber?: string;
  summary?: string;
  fullText?: string;
  url: string;
  sourceWebsite: string;
}

// Government content data structure
export interface GovernmentContentData {
  title: string;
  type: string;
  publishedDate: Date;
  description?: string;
  fullText?: string;
  url: string;
  source?: string;
}

// Court case data structure
export interface CourtCaseData {
  caseNumber: string;
  title: string;
  court: string;
  filedDate?: Date;
  description?: string;
  status?: string;
  fullText?: string;
  url: string;
}

// Image result from search
export interface ImageResult {
  url: string;
  alt: string;
  source: string;
  sourceUrl: string;
}

// Metrics tracking for scraper runs
export interface ScraperMetrics {
  totalProcessed: number;
  newEntries: number;
  existingUnchanged: number;
  existingChanged: number;
  aiArticlesGenerated: number;
  imagesSearched: number;
}

// Existing record check result
export interface ExistingRecordCheck {
  exists: boolean;
  contentHash?: string;
  hasArticle: boolean;
  hasThumbnail: boolean;
}
