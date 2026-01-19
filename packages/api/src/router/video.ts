import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, CourtCase, GovernmentContent } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Schema for video/feed post (using real content)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const VideoPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  author: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  type: z.enum(["bill", "order", "case", "general"]),
  articlePreview: z.string(), // Preview of article content
});

export type VideoPost = z.infer<typeof VideoPostSchema>;

const authors = [
  "@LegalUpdates",
  "@PolicyWatch",
  "@GovAnalysis",
  "@CitizenInfo",
];

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    if (temp !== undefined && shuffled[j] !== undefined) {
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
  }
  return shuffled;
}

// Generate feed post from content
const generateFeedPost = (content: VideoPost, index: number): VideoPost => {
  const randomAuthor =
    authors[Math.floor(Math.random() * authors.length)] ?? "@LegalUpdates";

  return {
    id: `${content.id}-${index}`, // Make ID unique by including index
    title: content.title,
    description: content.description,
    author: randomAuthor,
    likes: Math.floor(Math.random() * 50000) + 1000,
    comments: Math.floor(Math.random() * 2000) + 50,
    shares: Math.floor(Math.random() * 1000) + 10,
    type: content.type,
    articlePreview: content.articlePreview,
  };
};

export const videoRouter = {
  // Get videos with cursor-based pagination for infinite scroll
  getInfinite: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(), // Cursor is the index of the last video
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor = 0 } = input;

      // Fetch real content from database
      const bills = await db
        .select()
        .from(Bill)
        .orderBy(desc(Bill.createdAt))
        .limit(20);
      const governmentContent = await db
        .select()
        .from(GovernmentContent)
        .orderBy(desc(GovernmentContent.createdAt))
        .limit(20);
      const courtCases = await db
        .select()
        .from(CourtCase)
        .orderBy(desc(CourtCase.createdAt))
        .limit(20);

      const prompt = `You are now a professional marketing copywriter. You will output a JSON object with 3 keys.
      1. The first key \`description\` will be a 50-word description of the following article. It should be as catchy and interesting as a news headline, as this will be part of a text-based feed (like Twitter) which users will scroll past.
      2. The second key \`image\` will be a prompt which will be fed into an image-generation AI model to create visuals to go along
      3. The third key \`title\` will be the title of the article. Make it limited to 25 characters.
      Here is the article:`;

      // Convert database content to feed format
      const dbContentForFeed = [
        ...bills.map((bill) => ({
          id: bill.id,
          title: bill.title,
          author: "govtrack.com",
          likes: 0,
          shares: 0,
          comments: 0,
          description:
            bill.description ?? bill.summary ?? "No description available",
          type: "bill" as const,
          articlePreview:
            bill.summary ?? bill.description ?? "No preview available",
        })),
        ...governmentContent.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description ?? "No description available",
          type: "general" as const,
          author: "whitehouse.gov",
          likes: 0,
          shares: 0,
          comments: 0,
          articlePreview:
            content.description ??
            content.fullText?.substring(0, 200) ??
            "No preview available",
        })),
        ...courtCases.map((courtCase) => ({
          id: courtCase.id,
          author: "congress?",
          likes: 0,
          shares: 0,
          comments: 0,
          title: courtCase.title,
          description: courtCase.description ?? "No description available",
          type: "case" as const,
          articlePreview: courtCase.description ?? "No preview available",
        })),
      ] satisfies VideoPost[];

      // Use database content
      const allContent = dbContentForFeed;

      // Create a repeating shuffled feed by cycling through content
      const shuffledContent = shuffleArray(allContent);
      const videos = Array.from({ length: limit }, (_, index) => {
        const contentIndex = (cursor + index) % shuffledContent.length;
        const content = shuffledContent[contentIndex];
        if (!content) {
          throw new Error("Content not found at index");
        }
        return generateFeedPost(content, cursor + index);
      });

      return {
        videos,
        nextCursor: cursor + limit,
      };
    }),
} satisfies TRPCRouterRecord;
