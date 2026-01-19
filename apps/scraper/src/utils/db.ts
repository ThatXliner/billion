import { createHash } from 'crypto';
import { eq, and } from '@acme/db';
import { db } from '@acme/db/client';
import { Bill, GovernmentContent, CourtCase } from '@acme/db/schema';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { searchImages, generateImageSearchKeywords, getThumbnailImage, type ImageResult } from './image-search.js';

// Utility to create a hash of content for version tracking
export function createContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Generate AI summary using OpenAI
export async function generateAISummary(
  title: string,
  content: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Generate a concise, engaging summary (max 100 characters) for this government content. Focus on the key action or impact.

Title: ${title}

Content: ${content.substring(0, 2000)}

Summary (max 100 characters):`,
    });

    // Ensure it's under 100 characters
    return text.trim().substring(0, 100);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Fallback to simple truncation
    return content.substring(0, 97) + '...';
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
      model: openai('gpt-4o-mini'),
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
    console.error('Error generating AI article:', error);
    // Return empty string on error - will fall back to fullText in UI
    return '';
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
  // Generate AI summary if description is not provided
  let description = billData.description;
  if (!description && (billData.summary || billData.fullText)) {
    console.log(`Generating AI summary for bill: ${billData.title}`);
    description = await generateAISummary(
      billData.title,
      billData.summary || billData.fullText || ''
    );
  }

  // Generate AI article if fullText is available
  let aiGeneratedArticle = '';
  if (billData.fullText) {
    aiGeneratedArticle = await generateAIArticle(
      billData.title,
      billData.fullText,
      'bill',
      billData.url
    );
  }

  // Search for relevant images
  let thumbnailUrl: string | null = null;
  let images: ImageResult[] = [];
  if (billData.fullText) {
    console.log(`Searching for images for bill: ${billData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      billData.title,
      billData.fullText,
      'bill'
    );
    console.log(`Image search query: ${searchQuery}`);
    
    // Get thumbnail and additional images
    thumbnailUrl = await getThumbnailImage(searchQuery);
    images = await searchImages(searchQuery, 3);
  }

  const contentForHash = JSON.stringify({
    title: billData.title,
    description: description,
    status: billData.status,
    summary: billData.summary,
    fullText: billData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  const [result] = await db
    .insert(Bill)
    .values({
      ...billData,
      description,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      images: images.length > 0 ? images : undefined,
      contentHash,
      versions: [],
    })
    .onConflictDoUpdate({
      target: [Bill.billNumber, Bill.sourceWebsite],
      set: (excluded) => {
        // Only update if content hash has changed
        // This requires a subquery approach or we need to handle version tracking differently
        return {
          title: excluded.title,
          description: excluded.description,
          sponsor: excluded.sponsor,
          status: excluded.status,
          introducedDate: excluded.introducedDate,
          congress: excluded.congress,
          chamber: excluded.chamber,
          summary: excluded.summary,
          fullText: excluded.fullText,
          aiGeneratedArticle: excluded.aiGeneratedArticle,
          thumbnailUrl: excluded.thumbnailUrl,
          images: excluded.images,
          url: excluded.url,
          contentHash: excluded.contentHash,
          updatedAt: new Date(),
        };
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
  // Generate AI article if fullText is available
  let aiGeneratedArticle = '';
  if (contentData.fullText) {
    aiGeneratedArticle = await generateAIArticle(
      contentData.title,
      contentData.fullText,
      contentData.type,
      contentData.url
    );
  }

  // Search for relevant images
  let thumbnailUrl: string | null = null;
  let images: ImageResult[] = [];
  if (contentData.fullText) {
    console.log(`Searching for images for ${contentData.type}: ${contentData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      contentData.title,
      contentData.fullText,
      contentData.type
    );
    console.log(`Image search query: ${searchQuery}`);
    
    // Get thumbnail and additional images
    thumbnailUrl = await getThumbnailImage(searchQuery);
    images = await searchImages(searchQuery, 3);
  }

  const contentForHash = JSON.stringify({
    title: contentData.title,
    description: contentData.description,
    fullText: contentData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  const [result] = await db
    .insert(GovernmentContent)
    .values({
      ...contentData,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      images: images.length > 0 ? images : undefined,
      contentHash,
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
        aiGeneratedArticle: aiGeneratedArticle || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        images: images.length > 0 ? images : undefined,
        source: contentData.source,
        contentHash,
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
    publishedDate: actionData.publishedDate || actionData.issuedDate || new Date(),
    source: actionData.source || 'whitehouse.gov',
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
  // Generate AI summary if description is not provided
  let description = caseData.description;
  if (!description && caseData.fullText) {
    console.log(`Generating AI summary for court case: ${caseData.title}`);
    description = await generateAISummary(
      caseData.title,
      caseData.fullText
    );
  }

  // Generate AI article if fullText is available
  let aiGeneratedArticle = '';
  if (caseData.fullText) {
    aiGeneratedArticle = await generateAIArticle(
      caseData.title,
      caseData.fullText,
      'court case',
      caseData.url
    );
  }

  // Search for relevant images
  let thumbnailUrl: string | null = null;
  let images: ImageResult[] = [];
  if (caseData.fullText) {
    console.log(`Searching for images for court case: ${caseData.title}`);
    const searchQuery = await generateImageSearchKeywords(
      caseData.title,
      caseData.fullText,
      'court case'
    );
    console.log(`Image search query: ${searchQuery}`);
    
    // Get thumbnail and additional images
    thumbnailUrl = await getThumbnailImage(searchQuery);
    images = await searchImages(searchQuery, 3);
  }

  const contentForHash = JSON.stringify({
    title: caseData.title,
    description: description,
    status: caseData.status,
    fullText: caseData.fullText,
  });
  const contentHash = createContentHash(contentForHash);

  const [result] = await db
    .insert(CourtCase)
    .values({
      ...caseData,
      description,
      aiGeneratedArticle: aiGeneratedArticle || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      images: images.length > 0 ? images : undefined,
      contentHash,
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
        aiGeneratedArticle: aiGeneratedArticle || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        images: images.length > 0 ? images : undefined,
        url: caseData.url,
        contentHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`Court case ${caseData.caseNumber} upserted`);
  return result;
}
