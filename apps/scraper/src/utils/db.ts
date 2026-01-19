import { createHash } from 'crypto';
import { eq, and } from '@acme/db';
import { db } from '@acme/db/client';
import { Bill, GovernmentContent, CourtCase } from '@acme/db/schema';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { generateImageSearchKeywords, getThumbnailImage } from './image-search.js';

// Metrics tracking for scraper runs
export interface ScraperMetrics {
  totalProcessed: number;
  newEntries: number;
  existingUnchanged: number;
  existingChanged: number;
  aiArticlesGenerated: number;
  imagesSearched: number;
}

// Global metrics object for the current run
let currentMetrics: ScraperMetrics = {
  totalProcessed: 0,
  newEntries: 0,
  existingUnchanged: 0,
  existingChanged: 0,
  aiArticlesGenerated: 0,
  imagesSearched: 0,
};

// Reset metrics for a new scraper run
export function resetMetrics(): void {
  currentMetrics = {
    totalProcessed: 0,
    newEntries: 0,
    existingUnchanged: 0,
    existingChanged: 0,
    aiArticlesGenerated: 0,
    imagesSearched: 0,
  };
}

// Get current metrics
export function getMetrics(): ScraperMetrics {
  return { ...currentMetrics };
}

// Print metrics summary
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
  console.log(`API Calls Saved:      ~${apiCallsSaved} (from skipping unchanged content)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// Utility to create a hash of content for version tracking
export function createContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// Generate AI summary using OpenAI
export async function generateAISummary(
  title: string,
  content: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Generate a concise, engaging summary (max 100 characters) for this government content. Focus on the key action or impact.

Title: ${title}

Content: ${content.substring(0, 2000)}

Summary (max 100 characters):`,
    });

    // Ensure it's under 100 characters
    return text.trim().substring(0, 100);
  } catch (error) {
    console.error("Error generating AI summary:", error);
    // Fallback to simple truncation
    return content.substring(0, 97) + "...";
  }
}

// Generate AI article using OpenAI - accessible, engaging version
export async function generateAIArticle(
  title: string,
  fullText: string,
  type: string,
  url: string,
): Promise<string> {
  try {
    console.log(`Generating AI article for: ${title}`);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are an expert at making government and legal content accessible and engaging for everyday people. Transform the following ${type} into a well-structured, markdown-formatted article.

**Structure your article with these 4 sections:**

## What This Means For You
Write 2-3 concise sentences (max 150 words) that immediately tell everyday people what this means for their lives. Use plain language, avoid jargon, and focus on direct impact. Make it relatable and concrete.

## Overview
Provide a balanced, neutral, and informative explanation of what this ${type} is about. Use engaging storytelling elements while remaining objective. Break down complex concepts, define technical terms, and provide context. Make it interesting to read while being thorough. Aim for 200-400 words.

## Impact & Implications
Explain what this means in practice. Who is affected and how? What are the short-term and long-term implications? What changes as a result? Use real-world examples when possible. Be specific about practical effects. Aim for 200-300 words.

## The Debate
Present both sides of the political spectrum's views on this matter. Give equal weight to supporters and critics. Quote or paraphrase key arguments from both perspectives. Remain objective and let readers understand different viewpoints. Structure this as:
- **Supporters argue:** [their main points]
- **Critics contend:** [their main points]

Aim for 200-300 words, balanced between both sides.

---

**Formatting Guidelines:**
- Use markdown headers (##) for each section
- Use **bold** for emphasis on key terms
- Use bullet points or numbered lists where appropriate
- Include blockquotes (>) for any direct quotes from the original text
- Keep paragraphs short (2-4 sentences) for readability
- Use 8th-grade reading level language
- Define any necessary technical/legal terms inline

**Original Content:**

Title: ${title}
Type: ${type}
URL: ${url}

${fullText}

---

Write the article now using the 4-section structure above:`,
    });

    return text.trim();
  } catch (error) {
    console.error("Error generating AI article:", error);
    // Return empty string on error - will fall back to fullText in UI
    return "";
  }
}

// Check if a bill already exists and retrieve its metadata
async function checkExistingBill(
  billNumber: string,
  sourceWebsite: string
): Promise<{
  exists: boolean;
  contentHash?: string;
  hasArticle: boolean;
  hasThumbnail: boolean;
} | null> {
  try {
    const [existing] = await db
      .select({
        contentHash: Bill.contentHash,
        aiGeneratedArticle: Bill.aiGeneratedArticle,
        thumbnailUrl: Bill.thumbnailUrl,
      })
      .from(Bill)
      .where(and(eq(Bill.billNumber, billNumber), eq(Bill.sourceWebsite, sourceWebsite)))
      .limit(1);

    if (!existing) {
      return null;
    }

    return {
      exists: true,
      contentHash: existing.contentHash,
      hasArticle: !!existing.aiGeneratedArticle,
      hasThumbnail: !!existing.thumbnailUrl,
    };
  } catch (error) {
    console.error("Error checking existing bill:", error);
    return null;
  }
}

// Check if government content already exists and retrieve its metadata
async function checkExistingGovernmentContent(
  url: string
): Promise<{
  exists: boolean;
  contentHash?: string;
  hasArticle: boolean;
  hasThumbnail: boolean;
} | null> {
  try {
    const [existing] = await db
      .select({
        contentHash: GovernmentContent.contentHash,
        aiGeneratedArticle: GovernmentContent.aiGeneratedArticle,
        thumbnailUrl: GovernmentContent.thumbnailUrl,
      })
      .from(GovernmentContent)
      .where(eq(GovernmentContent.url, url))
      .limit(1);

    if (!existing) {
      return null;
    }

    return {
      exists: true,
      contentHash: existing.contentHash,
      hasArticle: !!existing.aiGeneratedArticle,
      hasThumbnail: !!existing.thumbnailUrl,
    };
  } catch (error) {
    console.error("Error checking existing government content:", error);
    return null;
  }
}

// Check if a court case already exists and retrieve its metadata
async function checkExistingCourtCase(
  caseNumber: string
): Promise<{
  exists: boolean;
  contentHash?: string;
  hasArticle: boolean;
  hasThumbnail: boolean;
} | null> {
  try {
    const [existing] = await db
      .select({
        contentHash: CourtCase.contentHash,
        aiGeneratedArticle: CourtCase.aiGeneratedArticle,
        thumbnailUrl: CourtCase.thumbnailUrl,
      })
      .from(CourtCase)
      .where(eq(CourtCase.caseNumber, caseNumber))
      .limit(1);

    if (!existing) {
      return null;
    }

    return {
      exists: true,
      contentHash: existing.contentHash,
      hasArticle: !!existing.aiGeneratedArticle,
      hasThumbnail: !!existing.thumbnailUrl,
    };
  } catch (error) {
    console.error("Error checking existing court case:", error);
    return null;
  }
}

// Insert or update a bill with version tracking
export async function upsertBill(billData: {
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
}) {
  // Generate contentHash for incoming data
  const contentForHash = JSON.stringify({
    title: billData.title,
    description: billData.description,
    status: billData.status,
    summary: billData.summary,
    fullText: billData.fullText,
  });
  const newContentHash = createContentHash(contentForHash);

  // Check if entry exists
  const existing = await checkExistingBill(
    billData.billNumber,
    billData.sourceWebsite
  );

  // Track metrics
  currentMetrics.totalProcessed++;

  // Determine what needs to be generated
  let shouldGenerateArticle = false;
  let shouldGenerateImage = false;

  if (!existing) {
    // New entry - generate everything
    shouldGenerateArticle = !!billData.fullText;
    shouldGenerateImage = !!billData.fullText;
    currentMetrics.newEntries++;
    console.log(`New bill detected: ${billData.billNumber}`);
  } else if (existing.contentHash !== newContentHash) {
    // Content changed - regenerate article, keep image
    shouldGenerateArticle = !!billData.fullText;
    shouldGenerateImage = !existing.hasThumbnail && !!billData.fullText;
    currentMetrics.existingChanged++;
    console.log(`Content changed for bill: ${billData.billNumber}`);
  } else {
    // Content unchanged
    shouldGenerateArticle = false;
    shouldGenerateImage = !existing.hasThumbnail && !!billData.fullText;
    currentMetrics.existingUnchanged++;
    console.log(`No changes for bill: ${billData.billNumber}, skipping AI generation`);
  }

  // Generate AI summary if description is not provided
  let description = billData.description;
  if (!description && (billData.summary || billData.fullText) && shouldGenerateArticle) {
    console.log(`Generating AI summary for bill: ${billData.title}`);
    description = await generateAISummary(
      billData.title,
      billData.summary || billData.fullText || "",
    );
  }

  // Conditionally generate AI article
  let aiGeneratedArticle: string | undefined = undefined;
  if (shouldGenerateArticle && billData.fullText) {
    console.log(`Generating AI article for bill: ${billData.title}`);
    aiGeneratedArticle = await generateAIArticle(
      billData.title,
      billData.fullText,
      "bill",
      billData.url,
    );
    currentMetrics.aiArticlesGenerated++;
  } else if (existing?.hasArticle) {
    console.log(`Using existing AI article for bill: ${billData.billNumber}`);
  }

  // Conditionally search for thumbnail
  let thumbnailUrl: string | null | undefined = undefined;
  if (shouldGenerateImage) {
    console.log(`Searching for thumbnail for bill: ${billData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      billData.title,
      billData.fullText || '',
      'bill'
    );
    console.log(`Image search query: ${searchQuery}`);
    thumbnailUrl = await getThumbnailImage(searchQuery);
    currentMetrics.imagesSearched++;
  } else if (existing?.hasThumbnail) {
    console.log(`Using existing thumbnail for bill: ${billData.billNumber}`);
  }

  const [result] = await db
    .insert(Bill)
    .values({
      ...billData,
      description,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl === undefined ? undefined : thumbnailUrl || undefined,
      contentHash: newContentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: [Bill.billNumber, Bill.sourceWebsite],
      set: {
        title: billData.title,
        description: description,
        sponsor: billData.sponsor,
        status: billData.status,
        introducedDate: billData.introducedDate,
        congress: billData.congress,
        chamber: billData.chamber,
        summary: billData.summary,
        fullText: billData.fullText,
        // Only update these if new values were generated
        ...(aiGeneratedArticle !== undefined && { aiGeneratedArticle }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || undefined }),
        url: billData.url,
        contentHash: newContentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Bill ${billData.billNumber} upserted`);
  return result;
}

// Insert or update government content with version tracking
export async function upsertGovernmentContent(contentData: {
  title: string;
  type: string;
  publishedDate: Date;
  description?: string;
  fullText?: string;
  url: string;
  source?: string;
}) {
  // Generate contentHash for incoming data
  const contentForHash = JSON.stringify({
    title: contentData.title,
    description: contentData.description,
    fullText: contentData.fullText,
  });
  const newContentHash = createContentHash(contentForHash);

  // Check if entry exists
  const existing = await checkExistingGovernmentContent(contentData.url);

  // Track metrics
  currentMetrics.totalProcessed++;

  // Determine what needs to be generated
  let shouldGenerateArticle = false;
  let shouldGenerateImage = false;

  if (!existing) {
    // New entry - generate everything
    shouldGenerateArticle = !!contentData.fullText;
    shouldGenerateImage = !!contentData.fullText;
    currentMetrics.newEntries++;
    console.log(`New government content detected: ${contentData.title}`);
  } else if (existing.contentHash !== newContentHash) {
    // Content changed - regenerate article, keep image
    shouldGenerateArticle = !!contentData.fullText;
    shouldGenerateImage = !existing.hasThumbnail && !!contentData.fullText;
    currentMetrics.existingChanged++;
    console.log(`Content changed for government content: ${contentData.title}`);
  } else {
    // Content unchanged
    shouldGenerateArticle = false;
    shouldGenerateImage = !existing.hasThumbnail && !!contentData.fullText;
    currentMetrics.existingUnchanged++;
    console.log(`No changes for government content: ${contentData.title}, skipping AI generation`);
  }

  // Conditionally generate AI article
  let aiGeneratedArticle: string | undefined = undefined;
  if (shouldGenerateArticle && contentData.fullText) {
    console.log(`Generating AI article for ${contentData.type}: ${contentData.title}`);
    aiGeneratedArticle = await generateAIArticle(
      contentData.title,
      contentData.fullText,
      contentData.type,
      contentData.url,
    );
    currentMetrics.aiArticlesGenerated++;
  } else if (existing?.hasArticle) {
    console.log(`Using existing AI article for government content: ${contentData.title}`);
  }

  // Conditionally search for thumbnail
  let thumbnailUrl: string | null | undefined = undefined;
  if (shouldGenerateImage) {
    console.log(`Searching for thumbnail for ${contentData.type}: ${contentData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      contentData.title,
      contentData.fullText || '',
      contentData.type
    );
    console.log(`Image search query: ${searchQuery}`);
    thumbnailUrl = await getThumbnailImage(searchQuery);
    currentMetrics.imagesSearched++;
  } else if (existing?.hasThumbnail) {
    console.log(`Using existing thumbnail for government content: ${contentData.title}`);
  }

  const [result] = await db
    .insert(GovernmentContent)
    .values({
      ...contentData,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl === undefined ? undefined : thumbnailUrl || undefined,
      contentHash: newContentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: GovernmentContent.url,
      set: {
        title: contentData.title,
        type: contentData.type,
        publishedDate: contentData.publishedDate,
        description: contentData.description,
        fullText: contentData.fullText,
        // Only update these if new values were generated
        ...(aiGeneratedArticle !== undefined && { aiGeneratedArticle }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || undefined }),
        source: contentData.source,
        contentHash: newContentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Government content "${contentData.title}" upserted`);
  return result;
}

// Legacy function name for backward compatibility
export async function upsertPresidentialAction(actionData: {
  title: string;
  type: string;
  issuedDate?: Date;
  publishedDate?: Date;
  description?: string;
  fullText?: string;
  url: string;
  source?: string;
}) {
  return upsertGovernmentContent({
    ...actionData,
    publishedDate:
      actionData.publishedDate || actionData.issuedDate || new Date(),
    source: actionData.source || "whitehouse.gov",
  });
}

// Insert or update a court case with version tracking
export async function upsertCourtCase(caseData: {
  caseNumber: string;
  title: string;
  court: string;
  filedDate?: Date;
  description?: string;
  status?: string;
  fullText?: string;
  url: string;
}) {
  // Generate contentHash for incoming data
  const contentForHash = JSON.stringify({
    title: caseData.title,
    description: caseData.description,
    status: caseData.status,
    fullText: caseData.fullText,
  });
  const newContentHash = createContentHash(contentForHash);

  // Check if entry exists
  const existing = await checkExistingCourtCase(caseData.caseNumber);

  // Track metrics
  currentMetrics.totalProcessed++;

  // Determine what needs to be generated
  let shouldGenerateArticle = false;
  let shouldGenerateImage = false;

  if (!existing) {
    // New entry - generate everything
    shouldGenerateArticle = !!caseData.fullText;
    shouldGenerateImage = !!caseData.fullText;
    currentMetrics.newEntries++;
    console.log(`New court case detected: ${caseData.caseNumber}`);
  } else if (existing.contentHash !== newContentHash) {
    // Content changed - regenerate article, keep image
    shouldGenerateArticle = !!caseData.fullText;
    shouldGenerateImage = !existing.hasThumbnail && !!caseData.fullText;
    currentMetrics.existingChanged++;
    console.log(`Content changed for court case: ${caseData.caseNumber}`);
  } else {
    // Content unchanged
    shouldGenerateArticle = false;
    shouldGenerateImage = !existing.hasThumbnail && !!caseData.fullText;
    currentMetrics.existingUnchanged++;
    console.log(`No changes for court case: ${caseData.caseNumber}, skipping AI generation`);
  }

  // Generate AI summary if description is not provided
  let description = caseData.description;
  if (!description && caseData.fullText && shouldGenerateArticle) {
    console.log(`Generating AI summary for court case: ${caseData.title}`);
    description = await generateAISummary(caseData.title, caseData.fullText);
  }

  // Conditionally generate AI article
  let aiGeneratedArticle: string | undefined = undefined;
  if (shouldGenerateArticle && caseData.fullText) {
    console.log(`Generating AI article for court case: ${caseData.title}`);
    aiGeneratedArticle = await generateAIArticle(
      caseData.title,
      caseData.fullText,
      "court case",
      caseData.url,
    );
    currentMetrics.aiArticlesGenerated++;
  } else if (existing?.hasArticle) {
    console.log(`Using existing AI article for court case: ${caseData.caseNumber}`);
  }

  // Conditionally search for thumbnail
  let thumbnailUrl: string | null | undefined = undefined;
  if (shouldGenerateImage) {
    console.log(`Searching for thumbnail for court case: ${caseData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      caseData.title,
      caseData.fullText || '',
      'court case'
    );
    console.log(`Image search query: ${searchQuery}`);
    thumbnailUrl = await getThumbnailImage(searchQuery);
    currentMetrics.imagesSearched++;
  } else if (existing?.hasThumbnail) {
    console.log(`Using existing thumbnail for court case: ${caseData.caseNumber}`);
  }

  const [result] = await db
    .insert(CourtCase)
    .values({
      ...caseData,
      description,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl === undefined ? undefined : thumbnailUrl || undefined,
      contentHash: newContentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: CourtCase.caseNumber,
      set: {
        title: caseData.title,
        court: caseData.court,
        filedDate: caseData.filedDate,
        description: description,
        status: caseData.status,
        fullText: caseData.fullText,
        // Only update these if new values were generated
        ...(aiGeneratedArticle !== undefined && { aiGeneratedArticle }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl || undefined }),
        url: caseData.url,
        contentHash: newContentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Court case ${caseData.caseNumber} upserted`);
  return result;
}
