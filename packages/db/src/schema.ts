import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Bills table for congressional legislation
export const Bill = pgTable("bill", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  billNumber: t.varchar({ length: 100 }).notNull(), // e.g., "H.R. 1234"
  title: t.text().notNull(),
  description: t.text(),
  sponsor: t.varchar({ length: 256 }),
  status: t.varchar({ length: 100 }), // e.g., "Introduced", "Passed House", etc.
  introducedDate: t.timestamp(),
  congress: t.integer(), // e.g., 118 for 118th Congress
  chamber: t.varchar({ length: 50 }), // "House" or "Senate"
  summary: t.text(),
  fullText: t.text(),
  aiGeneratedArticle: t.text(), // AI-generated accessible article version (default depth: 3)
  articleGenerations: t
    .jsonb()
    .$type<{ depth: number; content: string; generatedAt: string }[]>()
    .default([]), // Cached articles at different depth levels (1-5)
  thumbnailUrl: t.text(), // URL of the thumbnail image
  images: t
    .jsonb()
    .$type<{ url: string; alt: string; source: string; sourceUrl: string }[]>()
    .default([]), // Array of relevant images for the article
  url: t.text().notNull(),
  sourceWebsite: t.varchar({ length: 50 }).notNull(), // "govtrack", "congress.gov"
  contentHash: t.varchar({ length: 64 }).notNull().default(""), // SHA-256 hash for version tracking
  versions: t
    .jsonb()
    .$type<{ hash: string; updatedAt: string; changes: string }[]>()
    .default([]), // Version history
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateBillSchema = createInsertSchema(Bill).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Government Content table (executive orders, memoranda, proclamations, news articles, briefings, etc.)
export const GovernmentContent = pgTable("government_content", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.text().notNull(),
  type: t.varchar({ length: 50 }).notNull(), // "Executive Order", "Memorandum", "Proclamation", "News Article", "Fact Sheet", "Briefing", etc.
  publishedDate: t.timestamp().notNull(),
  description: t.text(),
  fullText: t.text(),
  aiGeneratedArticle: t.text(), // AI-generated accessible article version (default depth: 3)
  articleGenerations: t
    .jsonb()
    .$type<{ depth: number; content: string; generatedAt: string }[]>()
    .default([]), // Cached articles at different depth levels (1-5)
  thumbnailUrl: t.text(), // URL of the thumbnail image
  images: t
    .jsonb()
    .$type<{ url: string; alt: string; source: string; sourceUrl: string }[]>()
    .default([]), // Array of relevant images for the article
  url: t.text().notNull().unique(), // Unique constraint for upsert by URL
  source: t.varchar({ length: 100 }).notNull().default("whitehouse.gov"), // Source website
  contentHash: t.varchar({ length: 64 }).notNull().default(""), // SHA-256 hash for version tracking
  versions: t
    .jsonb()
    .$type<{ hash: string; updatedAt: string; changes: string }[]>()
    .default([]), // Version history
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateGovernmentContentSchema = createInsertSchema(
  GovernmentContent,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Legacy export for backward compatibility
export const PresidentialAction = GovernmentContent;
export const CreatePresidentialActionSchema = CreateGovernmentContentSchema;

// Court Cases table
export const CourtCase = pgTable("court_case", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  caseNumber: t.varchar({ length: 100 }).notNull(),
  title: t.text().notNull(),
  court: t.varchar({ length: 256 }).notNull(), // e.g., "Supreme Court", "9th Circuit"
  filedDate: t.timestamp(),
  description: t.text(),
  status: t.varchar({ length: 100 }), // e.g., "Pending", "Decided"
  fullText: t.text(),
  aiGeneratedArticle: t.text(), // AI-generated accessible article version (default depth: 3)
  articleGenerations: t
    .jsonb()
    .$type<{ depth: number; content: string; generatedAt: string }[]>()
    .default([]), // Cached articles at different depth levels (1-5)
  thumbnailUrl: t.text(), // URL of the thumbnail image
  images: t
    .jsonb()
    .$type<{ url: string; alt: string; source: string; sourceUrl: string }[]>()
    .default([]), // Array of relevant images for the article
  url: t.text().notNull(),
  contentHash: t.varchar({ length: 64 }).notNull().default(""), // SHA-256 hash for version tracking
  versions: t
    .jsonb()
    .$type<{ hash: string; updatedAt: string; changes: string }[]>()
    .default([]), // Version history
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateCourtCaseSchema = createInsertSchema(CourtCase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
