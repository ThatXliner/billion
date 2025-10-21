import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { publicProcedure } from "../trpc";

// Schema for video post
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
  emoji: z.string(),
  backgroundColor: z.string(),
});

export type VideoPost = z.infer<typeof VideoPostSchema>;

// Constants for random generation
const videoEmojis = [
  "📺", "🎬", "🎭", "🎪", "🎨", "🎯", "🎲", "🎸", "🎹", "🎤",
  "🎧", "🎮", "🕹️", "🎰", "🎳", "🏆", "🏅", "🥇", "🥈", "🥉",
  "⚡", "🔥", "💎", "⭐", "🌟", "✨", "💫", "🌙", "☀️", "🌈",
  "🦄", "🚀", "💰", "💸", "🎊", "🎉", "🎈", "🎁", "🏰", "🗽",
];

const backgroundColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
  "#F1948A", "#85C1E9", "#D7BDE2", "#A9DFBF", "#F9E79F", "#D5A6BD",
  "#AED6F1", "#A3E4D7", "#F4D03F", "#D2B4DE", "#7FB3D3", "#76D7C4",
  "#F7DC6F", "#BB8FCE", "#85C1E9", "#82E0AA", "#F1948A", "#D7BDE2",
];

const videoTitles = [
  "Breaking: Healthcare Reform Bill Explained",
  "Supreme Court Decision Impact",
  "Environmental Case Breakdown",
  "Tax Reform Analysis",
  "Immigration Policy Update",
  "Education Bill Discussion",
  "Infrastructure Investment Plan",
  "Climate Change Legislation",
  "Social Security Reform",
  "Criminal Justice Update",
  "Trade Agreement Analysis",
  "Housing Policy Changes",
  "Energy Independence Bill",
  "National Security Update",
  "Economic Recovery Plan",
];

const videoDescriptions = [
  "TikTok style short form video describing the law/bill/action, its consequences, and views from both sides of the political spectrum",
  'Double tap the video to "like" it (causing the algorithm which helps with keeping you interested) and swipe up to read/watch the next one',
  "In our app, we can let you view the thing in question in 2 long-form modes: an engaging and visual/heavy AI-generated article or the original source",
  "Comprehensive breakdown of proposed legislation and its potential impacts on different demographics",
  "Expert analysis with public reaction and legal commentary from multiple perspectives",
  "Deep dive into policy implications with real-world examples and case studies",
];

const authors = [
  "@PoliticsExplained",
  "@LegalUpdates",
  "@EcoLegal",
  "@PolicyWatch",
  "@LawBreakdown",
  "@GovAnalysis",
  "@CitizenInfo",
  "@PolicyHub",
  "@LegalInsider",
  "@BillTracker",
  "@LawMakers",
  "@PolicyDeep",
];

// Generate random video data
const generateRandomVideo = (index: number): VideoPost => {
  const randomEmoji =
    videoEmojis[Math.floor(Math.random() * videoEmojis.length)] ?? "📺";
  const randomColor =
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)] ?? "#FF6B6B";
  const randomTitle =
    videoTitles[Math.floor(Math.random() * videoTitles.length)] ?? "Breaking News";
  const randomDescription =
    videoDescriptions[Math.floor(Math.random() * videoDescriptions.length)] ?? "Political update";
  const randomAuthor = authors[Math.floor(Math.random() * authors.length)] ?? "@PoliticsExplained";
  const types: ("bill" | "order" | "case" | "general")[] = [
    "bill",
    "order",
    "case",
    "general",
  ];
  const randomType = types[Math.floor(Math.random() * types.length)] ?? "general";

  return {
    id: `video-${index}`,
    title: randomTitle,
    description: randomDescription,
    author: randomAuthor,
    likes: Math.floor(Math.random() * 50000) + 1000,
    comments: Math.floor(Math.random() * 2000) + 50,
    shares: Math.floor(Math.random() * 1000) + 10,
    type: randomType,
    emoji: randomEmoji,
    backgroundColor: randomColor,
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
    .query(({ input }) => {
      const { limit, cursor = 0 } = input;
      const videos = Array.from({ length: limit }, (_, index) =>
        generateRandomVideo(cursor + index),
      );

      return {
        videos,
        nextCursor: cursor + limit,
      };
    }),
} satisfies TRPCRouterRecord;
