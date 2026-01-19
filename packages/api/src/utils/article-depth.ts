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
 * Generate an AI article at a specific depth level
 */
export async function generateArticleAtDepth(
  title: string,
  fullText: string,
  type: string,
  url: string,
  depth: ArticleDepth,
): Promise<string> {
  const { wordCount, instructions } = getDepthPrompt(depth);

  const result = await generateText({
    // @ts-ignore - AI SDK v5 type compatibility issue, works at runtime
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

Write the article now:`,
  });

  return result.text.trim();
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
  const generations = (content.articleGenerations as {
    depth: number;
    content: string;
    generatedAt: string;
  }[]) || [];
  
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

  const newArticle = await generateArticleAtDepth(
    content.title,
    content.fullText,
    contentType === "bill"
      ? "bill"
      : contentType === "case"
        ? "court case"
        : (content as any).type || "government content",
    (content as any).url || "",
    depth,
  );

  // Cache the generated article
  const updatedGenerations = [
    ...generations,
    {
      depth,
      content: newArticle,
      generatedAt: new Date().toISOString(),
    },
  ];

  await db
    .update(table)
    .set({ articleGenerations: updatedGenerations as any })
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
