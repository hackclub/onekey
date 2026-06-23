ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarded_at" timestamp with time zone;--> statement-breakpoint
-- Backfill: every existing user has already been through (or skipped) setup, so
-- mark them onboarded. New rows insert with NULL and get sent through the flow.
UPDATE "users" SET "onboarded_at" = now() WHERE "onboarded_at" IS NULL;
