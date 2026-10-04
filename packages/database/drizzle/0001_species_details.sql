ALTER TABLE "metadata"."species" ADD COLUMN "stage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metadata"."species" ADD COLUMN "generation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metadata"."species" ADD COLUMN "in_breeding_pool" boolean DEFAULT false NOT NULL;