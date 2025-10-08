export interface ScrapedBill {
  billId?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  billType?: string | null;
  billNumber?: string | null;
  congressSession?: string | null;
  introducedDate?: Date | null;
  signedDate?: Date | null;
  lastActionDate?: Date | null;
  status?: string | null;
  currentStage?: string | null;
  lastAction?: string | null;
  sponsor?: string | null;
  cosponsors?: string | null; // JSON string
  committees?: string | null; // JSON string
  housePassageVote?: string | null;
  senatePassageVote?: string | null;
  subjects?: string | null; // JSON string
  policyAreas?: string | null; // JSON string
  sourceUrl?: string | null;
  fullTextUrl?: string | null;
  congressGovUrl?: string | null;
  sourceSite?: string | null;
  scrapedDate?: Date | null;
}

export interface ScrapedExecutiveAction {
  actionId?: string | null;
  title?: string | null;
  description?: string | null;
  actionType?: string | null;
  actionNumber?: string | null;
  signedDate?: Date | null;
  publishedDate?: Date | null;
  summary?: string | null;
  subjects?: string | null; // JSON string
  sourceUrl?: string | null;
  fullTextUrl?: string | null;
  sourceSite?: string | null;
  scrapedDate?: Date | null;
}

export interface ScraperConfig {
  delay?: number;
  timeout?: number;
  userAgent?: string;
  headless?: boolean;
  maxRetries?: number;
}

export interface ScraperStats {
  totalItems: number;
  billsCount: number;
  executiveActionsCount: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

export type SpiderName = 'whitehouse' | 'congress' | 'govtrack' | 'all';

export interface Spider {
  name: string;
  scrape(): Promise<Array<ScrapedBill | ScrapedExecutiveAction>>;
}