import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { publicProcedure } from "../trpc";

// Schema for content card
const ContentCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["bill", "order", "case", "general"]),
  isAIGenerated: z.boolean(),
});

export type ContentCard = z.infer<typeof ContentCardSchema>;

// Mock data (will be replaced with database queries later)
const mockContent: ContentCard[] = [
  {
    id: "1",
    title: "AI Generated Short Form",
    description:
      "Video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
    type: "bill",
    isAIGenerated: true,
  },
  {
    id: "2",
    title: "Healthcare Reform Bill Analysis",
    description:
      "Comprehensive breakdown of the proposed healthcare legislation and its potential impacts on different demographics",
    type: "bill",
    isAIGenerated: true,
  },
  {
    id: "3",
    title: "Supreme Court Order Update",
    description:
      "Recent court ruling on constitutional matters with expert legal commentary and public reaction",
    type: "order",
    isAIGenerated: true,
  },
  {
    id: "4",
    title: "Environmental Case Study",
    description:
      "Ongoing legal case about environmental protection policies and corporate responsibility",
    type: "case",
    isAIGenerated: true,
  },
];

export const contentRouter = {
  // Get all content
  getAll: publicProcedure.query(() => {
    return mockContent;
  }),

  // Get content filtered by type
  getByType: publicProcedure
    .input(
      z.object({
        type: z.enum(["all", "bill", "order", "case"]).optional(),
      }),
    )
    .query(({ input }) => {
      if (!input.type || input.type === "all") {
        return mockContent;
      }
      return mockContent.filter((item) => item.type === input.type);
    }),
} satisfies TRPCRouterRecord;
