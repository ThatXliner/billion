/**
 * Metrics tracking for scraper runs
 * Tracks API calls, processing stats, and cost savings
 */

import type { ScraperMetrics } from '../types.js';

// Global metrics object for the current run
let currentMetrics: ScraperMetrics = {
  totalProcessed: 0,
  newEntries: 0,
  existingUnchanged: 0,
  existingChanged: 0,
  aiArticlesGenerated: 0,
  imagesSearched: 0,
  videosGenerated: 0,
  videosSkipped: 0,
};

/**
 * Reset metrics for a new scraper run
 */
export function resetMetrics(): void {
  currentMetrics = {
    totalProcessed: 0,
    newEntries: 0,
    existingUnchanged: 0,
    existingChanged: 0,
    aiArticlesGenerated: 0,
    imagesSearched: 0,
    videosGenerated: 0,
    videosSkipped: 0,
  };
}

/**
 * Get current metrics snapshot
 * @returns Copy of current metrics
 */
export function getMetrics(): ScraperMetrics {
  return { ...currentMetrics };
}

/**
 * Increment total processed count
 */
export function incrementTotalProcessed(): void {
  currentMetrics.totalProcessed++;
}

/**
 * Increment new entries count
 */
export function incrementNewEntries(): void {
  currentMetrics.newEntries++;
}

/**
 * Increment existing unchanged count
 */
export function incrementExistingUnchanged(): void {
  currentMetrics.existingUnchanged++;
}

/**
 * Increment existing changed count
 */
export function incrementExistingChanged(): void {
  currentMetrics.existingChanged++;
}

/**
 * Increment AI articles generated count
 */
export function incrementAIArticlesGenerated(): void {
  currentMetrics.aiArticlesGenerated++;
}

/**
 * Increment images searched count
 */
export function incrementImagesSearched(): void {
  currentMetrics.imagesSearched++;
}

/**
 * Increment videos generated count
 */
export function incrementVideosGenerated(): void {
  currentMetrics.videosGenerated++;
}

/**
 * Increment videos skipped count
 */
export function incrementVideosSkipped(): void {
  currentMetrics.videosSkipped++;
}

/**
 * Print formatted metrics summary
 * @param scraperName - Name of the scraper (for display)
 */
export function printMetricsSummary(scraperName: string): void {
  const apiCallsSaved = currentMetrics.existingUnchanged * 4; // 3 OpenAI + 1 Google per unchanged item

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${scraperName} Metrics Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total Processed:      ${currentMetrics.totalProcessed}`);
  console.log(`New Entries:          ${currentMetrics.newEntries}`);
  console.log(`Existing (Unchanged): ${currentMetrics.existingUnchanged}`);
  console.log(`Existing (Changed):   ${currentMetrics.existingChanged}`);
  console.log(`AI Articles Generated: ${currentMetrics.aiArticlesGenerated}`);
  console.log(`Images Searched:      ${currentMetrics.imagesSearched}`);
  console.log(`Videos Generated:     ${currentMetrics.videosGenerated}`);
  console.log(`Videos Skipped:       ${currentMetrics.videosSkipped}`);
  console.log(`API Calls Saved:      ~${apiCallsSaved} (from skipping unchanged content)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}
