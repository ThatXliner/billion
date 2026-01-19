import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, CourtCase, GovernmentContent } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Schema for content card
const ContentCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["bill", "order", "case", "general"]),
  isAIGenerated: z.boolean(),
  thumbnailUrl: z.string().optional(),
});

export type ContentCard = z.infer<typeof ContentCardSchema>;

// Schema for image data
const ImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  source: z.string(),
  sourceUrl: z.string(),
});

// Schema for detailed content
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ContentDetailSchema = ContentCardSchema.extend({
  articleContent: z.string(),
  originalContent: z.string(),
  images: z.array(ImageSchema).optional(),
});

export type ContentDetail = z.infer<typeof ContentDetailSchema>;

export const contentRouter = {
  // Get all content from database
  getAll: publicProcedure.query(async () => {
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

    const allContent: ContentCard[] = [
      // Bills from database
      ...bills.map((bill) => ({
        id: bill.id,
        title: bill.title,
        description: bill.description || bill.summary || "",
        type: "bill" as const,
        isAIGenerated: false,
        thumbnailUrl: bill.thumbnailUrl || undefined,
      })),
      // Government content (news articles, executive orders, etc.) from database
      ...governmentContent.map((content) => ({
        id: content.id,
        title: content.title,
        description: content.description || "",
        type: "general" as const,
        isAIGenerated: false,
        thumbnailUrl: content.thumbnailUrl || undefined,
      })),
      // Court cases from database
      ...courtCases.map((courtCase) => ({
        id: courtCase.id,
        title: courtCase.title,
        description: courtCase.description || "",
        type: "case" as const,
        isAIGenerated: false,
        thumbnailUrl: courtCase.thumbnailUrl || undefined,
      })),
    ];

    return allContent;
  }),

  // Get content filtered by type from database
  getByType: publicProcedure
    .input(
      z.object({
        type: z.enum(["all", "bill", "order", "case", "general"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.type || input.type === "all") {
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

        const allContent: ContentCard[] = [
          // Bills from database
          ...bills.map((bill) => ({
            id: bill.id,
            title: bill.title,
            description: bill.description || bill.summary || "",
            type: "bill" as const,
            isAIGenerated: false,
            thumbnailUrl: bill.thumbnailUrl || undefined,
          })),
          // Government content from database
          ...governmentContent.map((content) => ({
            id: content.id,
            title: content.title,
            description: content.description || "",
            type: "general" as const,
            isAIGenerated: false,
            thumbnailUrl: content.thumbnailUrl || undefined,
          })),
          // Court cases from database
          ...courtCases.map((courtCase) => ({
            id: courtCase.id,
            title: courtCase.title,
            description: courtCase.description || "",
            type: "case" as const,
            isAIGenerated: false,
            thumbnailUrl: courtCase.thumbnailUrl || undefined,
          })),
        ];

        return allContent;
      }

      if (input.type === "bill") {
        const bills = await db
          .select()
          .from(Bill)
          .orderBy(desc(Bill.createdAt))
          .limit(50);
        return bills.map((bill) => ({
          id: bill.id,
          title: bill.title,
          description: bill.description || bill.summary || "",
          type: "bill" as const,
          isAIGenerated: false,
          thumbnailUrl: bill.thumbnailUrl || undefined,
        }));
      }

      if (input.type === "order" || input.type === "general") {
        const governmentContent = await db
          .select()
          .from(GovernmentContent)
          .orderBy(desc(GovernmentContent.createdAt))
          .limit(50);
        return governmentContent.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || "",
          type: "general" as const,
          isAIGenerated: false,
          thumbnailUrl: content.thumbnailUrl || undefined,
        }));
      }

      if (input.type === "case") {
        const courtCases = await db
          .select()
          .from(CourtCase)
          .orderBy(desc(CourtCase.createdAt))
          .limit(50);
        return courtCases.map((courtCase) => ({
          id: courtCase.id,
          title: courtCase.title,
          description: courtCase.description || "",
          type: "case" as const,
          isAIGenerated: false,
          thumbnailUrl: courtCase.thumbnailUrl || undefined,
        }));
      }

      return [];
    }),

  // Get detailed content by ID from database
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // Try to find in bills
      const bill = await db
        .select()
        .from(Bill)
        .where(eq(Bill.id, input.id))
        .limit(1);
      if (bill.length > 0) {
        const b = bill[0]!;
        return {
          id: b.id,
          title: b.title,
          description: b.description || b.summary || "",
          type: "bill" as const,
          isAIGenerated: !!b.aiGeneratedArticle,
          thumbnailUrl: b.thumbnailUrl || undefined,
          images: b.images || undefined,
          articleContent: b.aiGeneratedArticle || b.fullText || "No content available",
          originalContent: b.fullText || "Full text not available",
        };
      }

      // Try to find in government content
      const content = await db
        .select()
        .from(GovernmentContent)
        .where(eq(GovernmentContent.id, input.id))
        .limit(1);
      if (content.length > 0) {
        const c = content[0]!;
        return {
          id: c.id,
          title: c.title,
          description: c.description || "",
          type: "general" as const,
          isAIGenerated: !!c.aiGeneratedArticle,
          thumbnailUrl: c.thumbnailUrl || undefined,
          images: c.images || undefined,
          articleContent: c.aiGeneratedArticle || c.fullText || "No content available",
          originalContent: c.fullText || "Full text not available",
        };
      }

      // Try to find in court cases
      const courtCase = await db
        .select()
        .from(CourtCase)
        .where(eq(CourtCase.id, input.id))
        .limit(1);
      if (courtCase.length > 0) {
        const c = courtCase[0]!;
        return {
          id: c.id,
          title: c.title,
          description: c.description || "",
          type: "case" as const,
          isAIGenerated: !!c.aiGeneratedArticle,
          thumbnailUrl: c.thumbnailUrl || undefined,
          images: c.images || undefined,
          articleContent: c.aiGeneratedArticle || c.fullText || "No content available",
          originalContent: c.fullText || "Full text not available",
        };
      }

      throw new Error(`Content with id ${input.id} not found`);
    }),
} satisfies TRPCRouterRecord;
