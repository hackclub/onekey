ALTER TABLE "approved_submissions" ADD COLUMN IF NOT EXISTS "author_birthday" text;--> statement-breakpoint
ALTER TABLE "approved_submissions" ADD COLUMN IF NOT EXISTS "internal_note" text;
