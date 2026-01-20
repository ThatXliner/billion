import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc } from "@acme/db";
import { db } from "@acme/db/client";
import { Video } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

// Schema for video/feed post (from Video table)
export const VideoPostSchema = z.object({
  id: z.string(),
  title: z.string().max(100),
  description: z.string(),
  author: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  type: z.enum(["bill", "government_content", "court_case", "general"]),
  articlePreview: z.string(),
  imageUri: z.string().optional(), // Data URI for image
  originalContentId: z.string(), // Reference to source content
});

export type VideoPost = z.infer<typeof VideoPostSchema>;

export const videoRouter = {
  // Get videos with cursor-based pagination for infinite scroll
  getInfinite: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { limit, cursor = 0 } = input;

      // Query Video table instead of source tables
      const videos = await db
        .select()
        .from(Video)
        .orderBy(desc(Video.createdAt))
        .limit(limit)
        .offset(cursor);

      // Transform to feed format with data URIs
      const feedPosts = videos.map((video) => {
        // Convert binary image to data URI for expo-image
        let imageUri: string | undefined;
        if (video.imageData && video.imageMimeType) {
          const base64 = video.imageData.toString("base64");
          imageUri = `data:${video.imageMimeType};base64,${base64}`;
        }

        const metrics = video.engagementMetrics as {
          likes: number;
          comments: number;
          shares: number;
        };

        // Map contentType to the enum values expected by frontend
        let type: "bill" | "government_content" | "court_case" | "general" =
          "general";
        if (
          video.contentType === "bill" ||
          video.contentType === "government_content" ||
          video.contentType === "court_case"
        ) {
          type = video.contentType;
        }

        return {
          id: video.id,
          title: video.title,
          description: video.description,
          author: video.author ?? "Unknown",
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          type,
          articlePreview: video.description, // Marketing description as preview
          imageUri, // Data URI for image
          originalContentId: video.contentId, // For "Read Full Article" navigation
        };
      });

      return {
        videos: feedPosts,
        nextCursor: cursor + limit,
      };
    }),
} satisfies TRPCRouterRecord;
