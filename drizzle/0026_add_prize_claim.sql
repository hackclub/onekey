ALTER TABLE "shop_items" ADD COLUMN IF NOT EXISTS "unverified_prize" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prize_claimed_at" timestamp with time zone;
