import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, CourtCase, GovernmentContent } from "@acme/db/schema";

export type ArticleDepth = 1 | 2 | 3 | 4 | 5;

export const DEPTH_DESCRIPTIONS = {
  1: "Brief (100-200 words) - Quick overview with key points only",
  2: "Summary (300-400 words) - Essential facts and context",
  3: "Standard (500-700 words) - Balanced coverage with analysis",
  4: "Detailed (800-1000 words) - Comprehensive with examples",
  5: "Expert (1200+ words) - In-depth with historical context and implications",
} as const;

/**
 * Get the word count range and prompt instructions for each depth level
 */
function getDepthPrompt(depth: ArticleDepth): {
  wordCount: string;
  instructions: string;
} {
  const prompts = {
    1: {
      wordCount: "100-200 words",
      instructions: `Write a VERY BRIEF article focused only on the most critical information.

## Structure (Single Section):
- Start with 2-3 sentences explaining what this is and why it matters
- List 3-5 key bullet points
- End with one sentence about immediate impact

Keep it extremely concise. Skip historical context and detailed analysis.`,
    },
    2: {
      wordCount: "300-400 words",
      instructions: `Write a SUMMARY-LENGTH article covering the essentials.

## Structure (2 Sections):
### What This Means For You (50-75 words)
Direct impact in 2-3 sentences.

### Overview (250-325 words)
- What this is about
- Key facts and figures
- Who is affected
- Immediate implications

Skip detailed background. Focus on current facts and direct effects.`,
    },
    3: {
      wordCount: "500-700 words",
      instructions: `Write a STANDARD-LENGTH balanced article with analysis.

## Structure (4 Sections):
### What This Means For You (75-100 words)
Direct impact with examples.

### Overview (200-250 words)
What's happening, context, and key details.

### Impact & Implications (150-200 words)
Short and long-term effects, who's affected.

### The Debate (150-200 words)
Brief coverage of both sides of the political spectrum.`,
    },
    4: {
      wordCount: "800-1000 words",
      instructions: `Write a DETAILED article with comprehensive coverage.

## Structure (5 Sections):
### What This Means For You (100-150 words)
Direct impact with concrete examples and scenarios.

### Overview (250-300 words)
Full context, background, key players, and detailed explanation.

### Impact & Implications (250-300 words)
Comprehensive analysis of effects across different groups and timelines.

### The Debate (200-250 words)
Balanced coverage of multiple viewpoints with specific arguments from each side.

### What's Next (100-150 words)
Timeline, expected developments, and what to watch for.`,
    },
    5: {
      wordCount: "1200+ words",
      instructions: `Write an EXPERT-LEVEL in-depth article with scholarly analysis.

## Structure (6 Sections):
### What This Means For You (150-200 words)
Detailed impact analysis with multiple scenarios and examples.

### Historical Context (200-300 words)
Background, precedents, how we got here, related past events.

### Overview (300-400 words)
Comprehensive explanation with all relevant details, players, and mechanisms.

### Impact & Implications (300-400 words)
Deep analysis of cascading effects across society, economy, and policy.

### The Debate (250-300 words)
Nuanced exploration of perspectives across the political spectrum with specific quotes and arguments.

### Expert Analysis & Future Outlook (200-300 words)
What experts are saying, potential scenarios, long-term implications, and what to watch.

Include specific data, quotes, and expert perspectives throughout.`,
    },
  };

  return prompts[depth];
}

/**
 * Extract citations from markdown article text
 * Looks for a "## Sources" section and parses [1], [2], etc.
 */
function extractCitations(articleText: string): {
  number: number;
  text: string;
  url: string;
  title?: string;
}[] {
  const citations: { number: number; text: string; url: string; title?: string }[] = [];
  
  // Find the Sources section
  const sourcesMatch = articleText.match(/## Sources\n([\s\S]*?)($|##)/);
  if (!sourcesMatch || !sourcesMatch[1]) return citations;
  
  const sourcesSection = sourcesMatch[1];
  
  // Match citation lines like: [1] Description - URL
  const citationRegex = /\[(\d+)\]\s*([^-\n]+?)\s*-\s*(https?:\/\/[^\s\n]+)/g;
  let match;
  
  while ((match = citationRegex.exec(sourcesSection)) !== null) {
    const [, number, text, url] = match;
    if (number && text && url) {
      citations.push({
        number: parseInt(number),
        text: text.trim(),
        url: url.trim(),
      });
    }
  }
  
  return citations;
}

/**
 * Remove the Sources section from article text (since we'll display citations separately)
 */
function removeSourcesSection(articleText: string): string {
  return articleText.replace(/## Sources\n[\s\S]*?($|(?=## [^S]))/g, '').trim();
}

/**
 * Generate an AI article at a specific depth level
 */
export async function generateArticleAtDepth(
  title: string,
  fullText: string,
  type: string,
  url: string,
  depth: ArticleDepth,
): Promise<{ article: string; citations: { number: number; text: string; url: string; title?: string }[] }> {
  const { wordCount, instructions } = getDepthPrompt(depth);

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `You are an expert at making government and legal content accessible and engaging for everyday people. Transform the following ${type} into a well-structured, markdown-formatted article.

**Target Length:** ${wordCount}

${instructions}

**Content to transform:**
Title: ${title}
Source: ${url}
Full Text: ${fullText.substring(0, 5000)}

**Formatting Guidelines:**
- Use markdown headers (##) for each section
- Use **bold** for emphasis on key terms
- Use bullet points or numbered lists where appropriate
- Include blockquotes (>) for any direct quotes
- Keep paragraphs short (2-4 sentences) for readability
- Use 8th-grade reading level language
- Focus on facts and balance - remain objective

**CRITICAL - Citations:**
You MUST include inline citations throughout the article to verify claims and facts. Use this format:
- Add [1], [2], [3] etc. after claims that need verification
- At the end of the article, add a "## Sources" section with:
  [1] Brief description of what this source verifies - URL
  [2] Brief description - URL
- For bills: cite congress.gov, govtrack.us, official bill pages
- For court cases: cite official court websites, legal databases
- For government content: cite whitehouse.gov, official agency sites
- Always include the original source URL as the first citation

Example:
The bill proposes $50 billion in funding [1] and has bipartisan support [2].

## Sources
[1] Bill text and funding details - https://congress.gov/bill/...
[2] Co-sponsor information - https://govtrack.us/...

Write the article now:`,
  });

  const fullArticle = result.text.trim();
  const citations = extractCitations(fullArticle);
  const article = removeSourcesSection(fullArticle);

  return { article, citations };
}

/**
 * Get cached article at specific depth or generate if not cached
 */
export async function getOrGenerateArticle(
  contentId: string,
  contentType: "bill" | "case" | "general",
  depth: ArticleDepth,
): Promise<{ content: string; cached: boolean }> {
  // Select the appropriate table
  const table =
    contentType === "bill"
      ? Bill
      : contentType === "case"
        ? CourtCase
        : GovernmentContent;

  // Fetch content from database
  const [content] = await db
    .select()
    .from(table)
    .where(eq(table.id, contentId))
    .limit(1);

  if (!content) {
    throw new Error(`Content with id ${contentId} not found`);
  }

  // Check if article at this depth exists in cache
  // Normalize the generations data to ensure generatedAt is always a string
  const generations = ((content.articleGenerations ?? []) as any[]).map(
    (gen) => ({
      depth: gen.depth,
      content: gen.content,
      generatedAt:
        typeof gen.generatedAt === "string"
          ? gen.generatedAt
          : gen.generatedAt instanceof Date
            ? gen.generatedAt.toISOString()
            : String(gen.generatedAt),
    }),
  );

  const cached = generations.find((gen) => gen.depth === depth);
  if (cached) {
    return { content: cached.content, cached: true };
  }

  // If depth is 3 and we have the default article, use it
  if (depth === 3 && content.aiGeneratedArticle) {
    return { content: content.aiGeneratedArticle, cached: true };
  }

  // Generate new article at requested depth
  if (!content.fullText) {
    throw new Error("Cannot generate article: fullText is missing");
  }

  const { article: newArticle, citations } = await generateArticleAtDepth(
    content.title,
    content.fullText,
    contentType === "bill" || contentType === "case"
      ? contentType
      : "government content",
    content.url || "",
    depth,
  );
  console.log(generations, newArticle);

  // Cache the generated article
  const updatedGenerations = [
    ...generations,
    {
      depth,
      content: newArticle,
      generatedAt: " new Date().toISOString()",
    },
  ];

  // Update both article generations and citations
  const updateData: any = { 
    articleGenerations: updatedGenerations,
    citations: citations,
  };
  
  await db
    .update(table)
    .set(updateData)
    .where(eq(table.id, contentId));

  return { content: newArticle, cached: false };
}

/**
 * Pre-generate articles at all depth levels (useful for batch processing)
 */
export async function preGenerateAllDepths(
  contentId: string,
  contentType: "bill" | "case" | "general",
): Promise<void> {
  const depths: ArticleDepth[] = [1, 2, 3, 4, 5];

  for (const depth of depths) {
    try {
      await getOrGenerateArticle(contentId, contentType, depth);
      console.log(`Generated article at depth ${depth} for ${contentId}`);
    } catch (error) {
      console.error(`Failed to generate depth ${depth}:`, error);
    }
  }
}
