import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { desc } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, GovernmentContent, CourtCase } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Schema for video/feed post (using real content)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VideoPostSchema = z.object({
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

// Import mock content from content router
// In a real app, this would be from a shared database
const mockContentForFeed = [
  {
    id: "1",
    title: "AI Generated Short Form",
    description:
      "Video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
    type: "bill" as const,
    articlePreview:
      "This comprehensive analysis breaks down the key components of the proposed legislation and examines its potential impact across different sectors of society.",
  },
  {
    id: "2",
    title: "Healthcare Reform Bill Analysis",
    description:
      "Comprehensive breakdown of the proposed healthcare legislation and its potential impacts on different demographics",
    type: "bill" as const,
    articlePreview:
      "The proposed Healthcare Reform Bill represents one of the most significant legislative efforts to modernize the American healthcare system in decades.",
  },
  {
    id: "3",
    title: "Supreme Court Order Update",
    description:
      "Recent court ruling on constitutional matters with expert legal commentary and public reaction",
    type: "order" as const,
    articlePreview:
      "In a 6-3 ruling, the Supreme Court has clarified the scope of constitutional protections in the digital age, establishing new precedents for privacy rights.",
  },
  {
    id: "4",
    title: "Environmental Case Study",
    description:
      "Ongoing legal case about environmental protection policies and corporate responsibility",
    type: "case" as const,
    articlePreview:
      "Multiple state attorneys general have brought suit against major corporations, alleging decades of environmental harm and misleading public statements.",
  },
];

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
const generateFeedPost = (
  content: (typeof mockContentForFeed)[number],
  index: number,
): VideoPost => {
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
      const bills = await db.select().from(Bill).orderBy(desc(Bill.createdAt)).limit(20);
      const governmentContent = await db.select().from(GovernmentContent).orderBy(desc(GovernmentContent.createdAt)).limit(20);
      const courtCases = await db.select().from(CourtCase).orderBy(desc(CourtCase.createdAt)).limit(20);

      // Convert database content to feed format
      const dbContentForFeed = [
        ...bills.map((bill) => ({
          id: bill.id,
          title: bill.title,
          description: bill.description || bill.summary || 'No description available',
          type: 'bill' as const,
          articlePreview: bill.summary || bill.description || 'No preview available',
        })),
        ...governmentContent.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || 'No description available',
          type: 'general' as const,
          articlePreview: content.description || content.fullText?.substring(0, 200) || 'No preview available',
        })),
        ...courtCases.map((courtCase) => ({
          id: courtCase.id,
          title: courtCase.title,
          description: courtCase.description || 'No description available',
          type: 'case' as const,
          articlePreview: courtCase.description || 'No preview available',
        })),
      ];

      // Combine mock content with database content
      const allContent = [...mockContentForFeed, ...dbContentForFeed];

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
