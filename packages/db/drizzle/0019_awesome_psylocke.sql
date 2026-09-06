CREATE TABLE "content_image_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"content_id" uuid NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"style_version" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"description" text,
	"rejection_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"feedback" text,
	"model_version" varchar(100) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "content_image_review_content_type_content_id_unique" UNIQUE("content_type","content_id")
);
--> statement-breakpoint
CREATE INDEX "content_image_review_content_id_idx" ON "content_image_review" USING btree ("content_id");
--> statement-breakpoint
ALTER TABLE "content_image_review" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
		REVOKE ALL ON TABLE "content_image_review" FROM anon;
	END IF;
	IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
		REVOKE ALL ON TABLE "content_image_review" FROM authenticated;
	END IF;
END
$$;
