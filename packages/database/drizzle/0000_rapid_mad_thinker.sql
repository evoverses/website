CREATE SCHEMA "metadata";
--> statement-breakpoint
CREATE TYPE "metadata"."chroma" AS ENUM('none', 'chroma', 'super');--> statement-breakpoint
CREATE TYPE "metadata"."element" AS ENUM('none', 'water', 'fire', 'air', 'plant', 'earth', 'light', 'dark', 'mineral', 'corrupt', 'ether', 'bug', 'monster');--> statement-breakpoint
CREATE TYPE "metadata"."gender" AS ENUM('unknown', 'male', 'female');--> statement-breakpoint
CREATE TYPE "metadata"."nature" AS ENUM('unknown', 'dauntless', 'executive', 'restless', 'nervous', 'cunning', 'energetic', 'clever', 'confident', 'ignorant', 'arrogant', 'biting', 'aggressive', 'patient', 'mature', 'sensible', 'calm', 'rude', 'cautious', 'curious', 'discrete', 'loyal');--> statement-breakpoint
CREATE TYPE "metadata"."rarity" AS ENUM('unknown');--> statement-breakpoint
CREATE TABLE "metadata"."evo" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" numeric,
	"gender" "metadata"."gender" DEFAULT 'unknown' NOT NULL,
	"generation" integer NOT NULL,
	"nature" "metadata"."nature" DEFAULT 'unknown' NOT NULL,
	"rarity" "metadata"."rarity" DEFAULT 'unknown' NOT NULL,
	"chroma" "metadata"."chroma" DEFAULT 'none' NOT NULL,
	"total_breeds" integer DEFAULT 0 NOT NULL,
	"last_breed_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"hatched_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"attack" integer DEFAULT 0 NOT NULL,
	"special" integer DEFAULT 0 NOT NULL,
	"defense" integer DEFAULT 0 NOT NULL,
	"resistance" integer DEFAULT 0 NOT NULL,
	"speed" integer DEFAULT 0 NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"treated" boolean DEFAULT false NOT NULL,
	"species_id" integer DEFAULT 0 NOT NULL,
	"parent1_token_id" numeric,
	"parent2_token_id" numeric,
	CONSTRAINT "token_id_unique" UNIQUE NULLS NOT DISTINCT("token_id")
);
--> statement-breakpoint
CREATE TABLE "metadata"."species" (
	"id" integer PRIMARY KEY NOT NULL,
	"species" text,
	"primary_type" "metadata"."element" NOT NULL,
	"secondary_type" "metadata"."element" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metadata"."evo" ADD CONSTRAINT "evo_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "metadata"."species"("id") ON DELETE no action ON UPDATE no action;