ALTER TABLE "bill" ADD COLUMN "article_generations" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "court_case" ADD COLUMN "article_generations" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "government_content" ADD COLUMN "article_generations" jsonb DEFAULT '[]'::jsonb;