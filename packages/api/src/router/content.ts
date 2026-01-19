import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { Bill, CourtCase, GovernmentContent } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Helper function to get thumbnail URL for any content
export async function getThumbnailForContent(
  id: string, 
  type: "bill" | "case" | "general"
): Promise<string | null> {
  try {
    if (type === "bill") {
      const result = await db
        .select({ thumbnailUrl: Bill.thumbnailUrl })
        .from(Bill)
        .where(eq(Bill.id, id))
        .limit(1);
      return result[0]?.thumbnailUrl || null;
    } else if (type === "case") {
      const result = await db
        .select({ thumbnailUrl: CourtCase.thumbnailUrl })
        .from(CourtCase)
        .where(eq(CourtCase.id, id))
        .limit(1);
      return result[0]?.thumbnailUrl || null;
    } else {
      const result = await db
        .select({ thumbnailUrl: GovernmentContent.thumbnailUrl })
        .from(GovernmentContent)
        .where(eq(GovernmentContent.id, id))
        .limit(1);
      return result[0]?.thumbnailUrl || null;
    }
  } catch (error) {
    console.error(`Error fetching thumbnail for ${type} ${id}:`, error);
    return null;
  }
}

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

// Schema for detailed content
const ContentDetailSchema = ContentCardSchema.extend({
  articleContent: z.string(),
  originalContent: z.string(),
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
          articleContent: c.aiGeneratedArticle || c.fullText || "No content available",
          originalContent: c.fullText || "Full text not available",
        };
      }

      throw new Error(`Content with id ${input.id} not found`);
    }),
} satisfies TRPCRouterRecord;
