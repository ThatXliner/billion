import { sql } from "drizzle-orm";
import { pgTable, index } from "drizzle-orm/pg-core";
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

// Bills table for legislative bills from Congress.gov and other sources
export const Bill = pgTable("bill", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  billId: t.varchar({ length: 256 }).unique(),
  title: t.varchar({ length: 1000 }),
  description: t.text(),
  summary: t.text(),
  billType: t.varchar({ length: 100 }),
  billNumber: t.varchar({ length: 50 }),
  congressSession: t.varchar({ length: 10 }),
  introducedDate: t.date(),
  signedDate: t.date(),
  lastActionDate: t.date(),
  status: t.varchar({ length: 200 }),
  currentStage: t.varchar({ length: 200 }),
  lastAction: t.text(),
  sponsor: t.varchar({ length: 500 }),
  cosponsors: t.text(), // JSON array of cosponsors
  committees: t.text(), // JSON array of committees
  housePassageVote: t.varchar({ length: 200 }),
  senatePassageVote: t.varchar({ length: 200 }),
  subjects: t.text(), // JSON array of subjects
  policyAreas: t.text(), // JSON array of policy areas
  sourceUrl: t.varchar({ length: 1000 }),
  fullTextUrl: t.varchar({ length: 1000 }),
  congressGovUrl: t.varchar({ length: 1000 }),
  sourceSite: t.varchar({ length: 100 }),
  scrapedDate: t.timestamp(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp({ mode: "date", withTimezone: true }).$onUpdateFn(() => sql`now()`),
}), (table) => ({
  billIdIdx: index("bill_id_idx").on(table.billId),
  sourceSiteIdx: index("source_site_idx").on(table.sourceSite),
  billTypeIdx: index("bill_type_idx").on(table.billType),
  congressSessionIdx: index("congress_session_idx").on(table.congressSession),
}));

// Executive Actions table for presidential actions from WhiteHouse.gov
export const ExecutiveAction = pgTable("executive_action", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  actionId: t.varchar({ length: 256 }).unique(),
  title: t.varchar({ length: 1000 }),
  description: t.text(),
  actionType: t.varchar({ length: 100 }),
  actionNumber: t.varchar({ length: 50 }),
  signedDate: t.date(),
  publishedDate: t.date(),
  summary: t.text(),
  subjects: t.text(), // JSON array of subjects
  sourceUrl: t.varchar({ length: 1000 }),
  fullTextUrl: t.varchar({ length: 1000 }),
  sourceSite: t.varchar({ length: 100 }),
  scrapedDate: t.timestamp(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp({ mode: "date", withTimezone: true }).$onUpdateFn(() => sql`now()`),
}), (table) => ({
  actionIdIdx: index("action_id_idx").on(table.actionId),
  actionTypeIdx: index("action_type_idx").on(table.actionType),
  sourceSiteIdx: index("executive_action_source_site_idx").on(table.sourceSite),
}));

export const CreateBillSchema = createInsertSchema(Bill, {
  title: z.string().max(1000).optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  billType: z.string().max(100).optional(),
  billNumber: z.string().max(50).optional(),
  congressSession: z.string().max(10).optional(),
  sponsor: z.string().max(500).optional(),
  sourceSite: z.string().max(100).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateExecutiveActionSchema = createInsertSchema(ExecutiveAction, {
  title: z.string().max(1000).optional(),
  description: z.string().optional(),
  actionType: z.string().max(100).optional(),
  actionNumber: z.string().max(50).optional(),
  summary: z.string().optional(),
  sourceSite: z.string().max(100).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
